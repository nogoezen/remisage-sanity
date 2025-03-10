import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import { useAuth } from '../context/AuthContext';
import { CreateMessageData } from '../services/messageService';
import { createMessageNotification } from '../utils/notificationUtils';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface NewMessageDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (messageData: CreateMessageData) => Promise<boolean>;
  users: User[];
  defaultRecipientId?: number;
}

const NewMessageDialog: React.FC<NewMessageDialogProps> = ({
  open,
  onClose,
  onSubmit,
  users = [],
  defaultRecipientId
}) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<{
    receiverId: string;
    subject: string;
    content: string;
  }>({
    receiverId: defaultRecipientId?.toString() || '',
    subject: '',
    content: ''
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Réinitialiser le formulaire lorsque le dialogue s'ouvre
  useEffect(() => {
    if (open) {
      setFormData({
        receiverId: defaultRecipientId?.toString() || '',
        subject: '',
        content: ''
      });
      setError(null);
      setSuccess(false);
    }
  }, [open, defaultRecipientId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error) {
      setError(null);
    }
  };
  
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    setFormData(prev => ({
      ...prev,
      receiverId: e.target.value
    }));
    
    if (error) {
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.receiverId) {
      setError('Veuillez sélectionner un destinataire.');
      return false;
    }
    
    if (!formData.subject.trim()) {
      setError('Veuillez entrer un sujet pour votre message.');
      return false;
    }
    
    if (!formData.content.trim() || formData.content.trim().length < 10) {
      setError('Veuillez entrer un message d\'au moins 10 caractères.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      const messageData: CreateMessageData = {
        senderId: user.id,
        receiverId: parseInt(formData.receiverId),
        subject: formData.subject,
        content: formData.content
      };
      
      const result = await onSubmit(messageData);
      if (result) {
        setSuccess(true);
        
        // Créer une notification pour le destinataire
        const recipient = users.find(u => u.id.toString() === formData.receiverId);
        if (recipient) {
          await createMessageNotification(
            0, // ID du message (à remplacer par l'ID réel dans une implémentation complète)
            user.id,
            `${user.firstName} ${user.lastName}`,
            formData.subject,
            recipient.id
          );
        }
        
        // Réinitialiser le formulaire après l'envoi réussi
        setFormData({
          receiverId: '',
          subject: '',
          content: ''
        });
        
        // Fermer le dialogue après un délai
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
      } else {
        setError('Échec de l\'envoi du message.');
      }
    } catch (err: any) {
      console.error('Erreur lors de l\'envoi du message:', err);
      setError(err.response?.data?.error || 'Une erreur est survenue lors de l\'envoi du message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!loading ? onClose : undefined}
      aria-labelledby="new-message-dialog-title"
      maxWidth="md"
      fullWidth
    >
      <DialogTitle id="new-message-dialog-title">
        <Box display="flex" alignItems="center">
          <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            Nouveau message
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ my: 2 }}>
            Votre message a été envoyé avec succès!
          </Alert>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        ) : null}
        
        <FormControl fullWidth margin="normal">
          <InputLabel id="recipient-label">Destinataire</InputLabel>
          <Select
            labelId="recipient-label"
            id="receiverId"
            name="receiverId"
            value={formData.receiverId}
            onChange={handleSelectChange}
            label="Destinataire"
            disabled={loading || success}
          >
            {users.length === 0 ? (
              <MenuItem value="" disabled>
                Aucun destinataire disponible
              </MenuItem>
            ) : (
              users.map((recipient) => (
                <MenuItem key={recipient.id} value={recipient.id.toString()}>
                  {recipient.firstName} {recipient.lastName} ({recipient.role === 'admin' ? 'Administrateur' : 'Employé'})
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
        
        <TextField
          margin="normal"
          id="subject"
          name="subject"
          label="Sujet"
          type="text"
          fullWidth
          value={formData.subject}
          onChange={handleChange}
          disabled={loading || success}
          required
        />
        
        <TextField
          margin="normal"
          id="content"
          name="content"
          label="Message"
          multiline
          rows={6}
          fullWidth
          value={formData.content}
          onChange={handleChange}
          disabled={loading || success}
          required
          placeholder="Écrivez votre message ici..."
        />
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained" 
          disabled={loading || success || !formData.receiverId || !formData.subject || !formData.content}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Envoi en cours...' : 'Envoyer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewMessageDialog; 