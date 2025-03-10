import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  Box,
  Divider,
  IconButton,
  CircularProgress,
  Chip,
  Paper,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import MailIcon from '@mui/icons-material/Mail';
import PersonIcon from '@mui/icons-material/Person';
import { Message } from '../services/messageService';
import { useAuth } from '../context/AuthContext';
import messageService from '../services/messageService';

interface MessageDetailDialogProps {
  open: boolean;
  onClose: () => void;
  messageId: number | null;
  onArchive: (id: number) => Promise<void>;
  onUnarchive: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onMessageRead: () => void;
}

const MessageDetailDialog: React.FC<MessageDetailDialogProps> = ({
  open,
  onClose,
  messageId,
  onArchive,
  onUnarchive,
  onDelete,
  onMessageRead
}) => {
  const { user } = useAuth();
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);

  // Charger les détails du message
  useEffect(() => {
    const fetchMessageDetails = async () => {
      if (!messageId || !open) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const messageData = await messageService.getById(messageId);
        setMessage(messageData);
        
        // Si le message n'était pas lu et que l'utilisateur est le destinataire, marquer comme lu
        if (!messageData.isRead && messageData.receiverId === user?.id) {
          await messageService.markAsRead(messageId);
          onMessageRead();
        }
      } catch (err) {
        console.error('Erreur lors du chargement du message:', err);
        setError('Impossible de charger les détails du message.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessageDetails();
  }, [messageId, open, user?.id, onMessageRead]);

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Vérifier si l'utilisateur est l'expéditeur du message
  const isUserSender = (message: Message) => message.senderId === user?.id;

  // Gérer l'archivage
  const handleArchive = async () => {
    if (!message) return;
    
    setActionInProgress(true);
    try {
      await onArchive(message.id);
      // Mettre à jour l'état local
      setMessage(prev => prev ? { ...prev, isArchived: true } : null);
    } catch (err) {
      console.error('Erreur lors de l\'archivage du message:', err);
    } finally {
      setActionInProgress(false);
    }
  };

  // Gérer le désarchivage
  const handleUnarchive = async () => {
    if (!message) return;
    
    setActionInProgress(true);
    try {
      await onUnarchive(message.id);
      // Mettre à jour l'état local
      setMessage(prev => prev ? { ...prev, isArchived: false } : null);
    } catch (err) {
      console.error('Erreur lors du désarchivage du message:', err);
    } finally {
      setActionInProgress(false);
    }
  };

  // Gérer la suppression
  const handleDelete = async () => {
    if (!message) return;
    
    setActionInProgress(true);
    try {
      await onDelete(message.id);
      onClose();
    } catch (err) {
      console.error('Erreur lors de la suppression du message:', err);
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="message-detail-dialog-title"
    >
      <DialogTitle id="message-detail-dialog-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div">
            {message?.subject || 'Détails du message'}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : message ? (
          <Box>
            {/* En-tête du message */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
              <Box display="flex" alignItems="center" mb={1}>
                <Box 
                  sx={{ 
                    mr: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white'
                  }}
                >
                  {isUserSender(message) ? <MailIcon /> : <PersonIcon />}
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {isUserSender(message) 
                      ? `À: ${message.receiverFirstName} ${message.receiverLastName}`
                      : `De: ${message.senderFirstName} ${message.senderLastName}`
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(message.createdAt)}
                  </Typography>
                </Box>
                
                {message.isArchived && (
                  <Chip 
                    label="Archivé" 
                    size="small" 
                    sx={{ ml: 'auto' }} 
                    color="default" 
                  />
                )}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                {message.subject}
              </Typography>
            </Paper>
            
            {/* Corps du message */}
            <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {message.content}
              </Typography>
            </Paper>
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary" align="center">
            Aucun message sélectionné
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
        <Box>
          {message && (
            <>
              {message.isArchived ? (
                <Button
                  startIcon={<UnarchiveIcon />}
                  onClick={handleUnarchive}
                  disabled={actionInProgress}
                  color="primary"
                >
                  Désarchiver
                </Button>
              ) : (
                <Button
                  startIcon={<ArchiveIcon />}
                  onClick={handleArchive}
                  disabled={actionInProgress}
                  color="primary"
                >
                  Archiver
                </Button>
              )}
              
              <Button
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                disabled={actionInProgress}
                color="error"
                sx={{ ml: 1 }}
              >
                Supprimer
              </Button>
            </>
          )}
        </Box>
        
        <Button onClick={onClose} color="inherit">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageDetailDialog; 