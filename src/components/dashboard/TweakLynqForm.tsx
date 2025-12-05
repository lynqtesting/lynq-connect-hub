import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Upload, MessageCircle, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';

interface TweakLynqFormProps {
  moduleId: string;
  userId: string;
  onSubmitSuccess: () => void;
}

const TWEAK_TYPES = [
  'Question / prompt text',
  'Case study content',
  'Cover page title / thumbnail text',
  'CTA wording for sales agents',
];

const formatCardName = (name: string): string => {
  // "Card_11_Quiz" → "Card 11 - Quiz"
  return name
    .replace(/_/g, ' ')
    .replace(/Card (\d+)/i, 'Card $1 -')
    .trim();
};

export function TweakLynqForm({ moduleId, userId, onSubmitSuccess }: TweakLynqFormProps) {
  const [tweakType, setTweakType] = useState(TWEAK_TYPES[0]);
  const [selectedCard, setSelectedCard] = useState('');
  const [description, setDescription] = useState('');
  const [cardOptions, setCardOptions] = useState<string[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attachment, setAttachment] = useState<{ file: File; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch deduction JSON columns for card options
  useEffect(() => {
    const fetchDeductionColumns = async () => {
      setLoadingCards(true);
      try {
        const { data, error } = await supabase
          .from('data_uploads')
          .select('metadata')
          .eq('module_id', moduleId)
          .eq('file_type', 'deduction_json')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        const metadata = data?.metadata as Record<string, unknown> | null;
        if (metadata?.columns && Array.isArray(metadata.columns)) {
          const columns = metadata.columns as string[];
          setCardOptions(columns);
          if (columns.length > 0) {
            setSelectedCard(columns[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching deduction columns:', error);
      } finally {
        setLoadingCards(false);
      }
    };

    fetchDeductionColumns();
  }, [moduleId]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setAttachment({ file, name: file.name });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeAttachment = () => {
    setAttachment(null);
  };

  const uploadFile = async (file: File): Promise<{ url: string; name: string } | null> => {
    const fileName = `tweak_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = `tweak-attachments/${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from('tweak-uploads')
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('tweak-uploads')
      .getPublicUrl(filePath);

    return { url: publicUrl, name: file.name };
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('Please describe what you want to change');
      return;
    }

    setSubmitting(true);
    setUploading(attachment !== null);

    try {
      let fileData: { url: string; name: string } | null = null;

      // Upload attachment if present
      if (attachment) {
        fileData = await uploadFile(attachment.file);
        if (!fileData) {
          toast.error('Failed to upload attachment');
          setSubmitting(false);
          setUploading(false);
          return;
        }
      }

      // Build notes with card reference
      const notes = selectedCard 
        ? `[${formatCardName(selectedCard)}] ${description}`
        : description;

      const { error } = await supabase
        .from('tweak_requests')
        .insert({
          module_id: moduleId,
          user_id: userId,
          title: tweakType,
          notes: notes,
          file_url: fileData?.url || null,
          file_name: fileData?.name || null,
        });

      if (error) throw error;

      toast.success('Tweak request submitted successfully');
      
      // Reset form
      setDescription('');
      setAttachment(null);
      setTweakType(TWEAK_TYPES[0]);
      if (cardOptions.length > 0) {
        setSelectedCard(cardOptions[0]);
      }
      
      onSubmitSuccess();
    } catch (error) {
      console.error('Error submitting tweak request:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi, I need help with a case study/cover rewrite for my LYNQ module.`
    );
    window.open(`https://wa.me/919810155157?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-brand mb-1">Tweak this LYNQ</h3>
        <p className="text-xs text-text-muted">
          Choose card → edit copy → add reference → submit to engine
        </p>
      </div>

      {/* Tweak Type */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-2 font-medium">
          Tweak Type
        </label>
        <div className="relative">
          <select
            value={tweakType}
            onChange={(e) => setTweakType(e.target.value)}
            className="appearance-none w-full bg-bg-surface border border-border-default text-text-primary rounded-lg px-3 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none pr-10 cursor-pointer"
          >
            {TWEAK_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none h-4 w-4" />
        </div>
      </div>

      {/* Select Question/Card */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-2 font-medium">
          Select Question / Card
        </label>
        <div className="relative">
          <select
            value={selectedCard}
            onChange={(e) => setSelectedCard(e.target.value)}
            disabled={loadingCards || cardOptions.length === 0}
            className="appearance-none w-full bg-bg-surface border border-border-default text-text-primary rounded-lg px-3 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none pr-10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingCards ? (
              <option>Loading cards...</option>
            ) : cardOptions.length === 0 ? (
              <option>No cards available</option>
            ) : (
              cardOptions.map((card) => (
                <option key={card} value={card}>
                  {formatCardName(card)}
                </option>
              ))
            )}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none h-4 w-4" />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-2 font-medium">
          What do you want to change?
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-bg-surface border border-border-default text-text-primary rounded-lg p-3 text-sm h-28 focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none placeholder:text-text-muted"
          placeholder="e.g. Change cover to 'iProtect Smart – Women Founders Edition', add claim example for South, tone = Hinglish"
        />
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-2 font-medium">
          Attachments (Optional)
        </label>
        
        {attachment ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 bg-bg-surface border border-border-default rounded-lg p-3"
          >
            <div className="w-8 h-8 rounded bg-brand/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-brand" />
            </div>
            <span className="text-sm text-text-primary truncate flex-1">
              {attachment.name}
            </span>
            <button
              onClick={removeAttachment}
              className="p-1 hover:bg-bg-surface-hover rounded text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <div
            {...getRootProps()}
            className={`
              border border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-brand bg-brand/5' 
                : 'border-border-default hover:border-text-muted'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">
                Drop PDF / image / SOP
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <Upload className="w-3 h-3 mr-1.5" />
                Upload
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp Help */}
      <div className="flex items-center justify-between py-2">
        <span className="text-xs text-text-muted">
          Need a human to rewrite case study / cover?
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openWhatsApp}
          className="bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 hover:text-[#25D366] text-xs"
        >
          <MessageCircle className="w-3 h-3 mr-1.5" />
          WhatsApp
        </Button>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={submitting || !description.trim()}
        className="w-full bg-bg-surface hover:bg-bg-surface-hover border border-border-default text-text-primary"
      >
        {uploading ? 'Uploading...' : submitting ? 'Submitting...' : 'Submit tweak'}
      </Button>
    </div>
  );
}
