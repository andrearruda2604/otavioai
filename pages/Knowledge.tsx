import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: 'pdf' | 'word';
    status: 'uploading' | 'uploaded' | 'error';
    url?: string;
}

export default function KnowledgePage() {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch uploaded files from storage or a files table
            const { data: filesData } = await supabase
                .from('knowledge_files')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (filesData) {
                setFiles(filesData.map((f: any) => ({
                    id: f.id,
                    name: f.file_name,
                    size: f.file_size,
                    type: f.file_type === 'application/pdf' ? 'pdf' : 'word',
                    status: 'uploaded',
                    url: f.file_url
                })));
            }
        } catch (error) {
            console.error('Error fetching knowledge data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        handleFiles(droppedFiles);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            handleFiles(selectedFiles);
        }
    };

    const handleFiles = async (selectedFiles: File[]) => {
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

        for (const file of selectedFiles) {
            if (!validTypes.includes(file.type)) {
                alert(`Arquivo "${file.name}" não é um PDF ou Word válido.`);
                continue;
            }

            const tempId = `temp-${Date.now()}-${Math.random()}`;
            const newFile: UploadedFile = {
                id: tempId,
                name: file.name,
                size: file.size,
                type: file.type === 'application/pdf' ? 'pdf' : 'word',
                status: 'uploading'
            };

            setFiles(prev => [...prev, newFile]);

            try {
                // Sanitize filename: remove accents, replace spaces with underscores
                const sanitizedName = file.name
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '') // Remove accents
                    .replace(/[^a-zA-Z0-9.-]/g, '_'); // Replace special chars with underscore

                // Upload to Supabase Storage
                const filePath = `${user?.id}/${Date.now()}-${sanitizedName}`;
                const { data: storageData, error: storageError } = await supabase.storage
                    .from('knowledge-files')
                    .upload(filePath, file);

                if (storageError) throw storageError;

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('knowledge-files')
                    .getPublicUrl(filePath);

                // Save metadata to DB
                const { data: dbData, error: dbError } = await supabase
                    .from('knowledge_files')
                    .insert({
                        user_id: user?.id,
                        file_name: file.name,
                        file_size: file.size,
                        file_type: file.type,
                        file_path: filePath,
                        file_url: urlData?.publicUrl
                    })
                    .select()
                    .single();

                if (dbError) throw dbError;

                // Update file status
                setFiles(prev => prev.map(f =>
                    f.id === tempId
                        ? { ...f, id: dbData.id, status: 'uploaded', url: urlData?.publicUrl }
                        : f
                ));
            } catch (error) {
                console.error('Error uploading file:', error);
                setFiles(prev => prev.map(f =>
                    f.id === tempId ? { ...f, status: 'error' } : f
                ));
            }
        }
    };

    const handleRemoveFile = async (fileId: string) => {
        const file = files.find(f => f.id === fileId);
        if (!file) return;

        try {
            // Delete from storage (would need file_path stored)
            // For now, just delete from DB
            await supabase.from('knowledge_files').delete().eq('id', fileId);
            setFiles(prev => prev.filter(f => f.id !== fileId));
        } catch (error) {
            console.error('Error removing file:', error);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando...</div>;

    return (
        <main className="p-8 max-w-4xl mx-auto space-y-8 relative overflow-hidden">
            {/* Overlay for "Coming Soon" */}
            <div className="absolute inset-0 z-50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white dark:bg-slate-800 px-8 py-4 rounded-full shadow-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="material-icons-round text-primary">rocket_launch</span>
                        Disponível em breve
                    </p>
                </div>
            </div>
            <header>
                <h2 className="text-3xl font-bold dark:text-white">Base de Conhecimento</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Configure as informações da sua empresa para o agente</p>
            </header>

            {/* Files Section */}
            <section className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold dark:text-white mb-2">Arquivos</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Faça upload de PDFs e documentos Word com informações sobre sua empresa</p>

                {/* Drag and Drop Area */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${isDragging
                        ? 'border-primary bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-300 dark:border-slate-700 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons-round text-slate-400 text-2xl">cloud_upload</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">
                        Arraste arquivos aqui ou clique para selecionar
                    </p>
                    <p className="text-xs text-slate-400">
                        Apenas PDF e Word (.pdf, .doc, .docx)
                    </p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="mt-6">
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">
                            Arquivos enviados ({files.length})
                        </p>
                        <div className="space-y-3">
                            {files.map(file => (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${file.type === 'pdf'
                                            ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'
                                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                            }`}>
                                            <span className="material-icons-round text-lg">
                                                {file.type === 'pdf' ? 'picture_as_pdf' : 'description'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-white text-sm">{file.name}</p>
                                            <p className="text-xs text-slate-400">
                                                {formatFileSize(file.size)} • {file.type === 'pdf' ? 'PDF' : 'WORD'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {file.status === 'uploading' && (
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        )}
                                        {file.status === 'uploaded' && (
                                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                                <span className="material-icons-round text-sm">check_circle</span>
                                                Enviado
                                            </span>
                                        )}
                                        {file.status === 'error' && (
                                            <span className="text-xs font-semibold text-rose-500">Erro</span>
                                        )}
                                        <button
                                            onClick={() => handleRemoveFile(file.id)}
                                            className="text-slate-400 hover:text-rose-500 transition-colors"
                                        >
                                            <span className="material-icons-round text-lg">close</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}