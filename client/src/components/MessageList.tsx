import React, { useState } from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Typography, 
  Divider, 
  IconButton, 
  Badge, 
  Box,
  Tooltip,
  Chip,
  Paper
} from '@mui/material';
import MailIcon from '@mui/icons-material/Mail';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import { Message } from '../services/messageService';
import { useAuth } from '../context/AuthContext';

interface MessageListProps {
  messages: Message[];
  onMessageClick: (message: Message) => void;
  onDelete?: (id: number) => void;
  onArchive?: (id: number) => void;
  onUnarchive?: (id: number) => void;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  onMessageClick, 
  onDelete, 
  onArchive,
  onUnarchive
}) => {
  const { user } = useAuth();
  // État pour suivre le message survolé
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);

  // Fonction pour formater la date
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

  // Obtenir le nom de l'autre partie (expéditeur ou destinataire)
  const getOtherPartyName = (message: Message) => {
    if (isUserSender(message)) {
      return `${message.receiverFirstName} ${message.receiverLastName}`;
    } else {
      return `${message.senderFirstName} ${message.senderLastName}`;
    }
  };

  return (
    <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {!messages || messages.length === 0 ? (
          <ListItem>
            <ListItemText 
              primary="Aucun message" 
              secondary="Vous n'avez pas encore de messages"
            />
          </ListItem>
        ) : (
          Array.isArray(messages) && messages.map((message, index) => (
            <React.Fragment key={message.id}>
              <ListItem 
                alignItems="flex-start"
                sx={{ 
                  cursor: 'pointer', 
                  backgroundColor: !message.isRead && !isUserSender(message) ? 'action.hover' : 'inherit',
                  transition: 'background-color 0.2s',
                  '&:hover': { backgroundColor: 'action.selected' }
                }}
                onClick={() => onMessageClick(message)}
                onMouseEnter={() => setHoveredMessageId(message.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                <ListItemAvatar>
                  <Badge 
                    color="primary" 
                    variant="dot" 
                    invisible={message.isRead || isUserSender(message)}
                  >
                    <Avatar>
                      {isUserSender(message) ? <MailIcon /> : <PersonIcon />}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center">
                      <Typography
                        component="span"
                        variant="body1"
                        fontWeight={!message.isRead && !isUserSender(message) ? 700 : 400}
                      >
                        {message.subject}
                      </Typography>
                      {message.isArchived && (
                        <Chip 
                          label="Archivé" 
                          size="small" 
                          sx={{ ml: 1 }} 
                          color="default" 
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {isUserSender(message) ? 'À: ' : 'De: '}
                        {getOtherPartyName(message)}
                      </Typography>
                      {" — "}
                      {message.content.length > 60 
                        ? `${message.content.substring(0, 60)}...`
                        : message.content}
                      <Typography
                        component="span"
                        variant="caption"
                        display="block"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {formatDate(message.createdAt)}
                      </Typography>
                    </React.Fragment>
                  }
                />
                
                {/* Actions au survol */}
                {hoveredMessageId === message.id && (
                  <Box>
                    {message.isArchived 
                      ? onUnarchive && (
                        <Tooltip title="Désarchiver">
                          <IconButton 
                            edge="end" 
                            aria-label="unarchive" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnarchive(message.id);
                            }}
                          >
                            <UnarchiveIcon />
                          </IconButton>
                        </Tooltip>
                      )
                      : onArchive && (
                        <Tooltip title="Archiver">
                          <IconButton 
                            edge="end" 
                            aria-label="archive" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onArchive(message.id);
                            }}
                          >
                            <ArchiveIcon />
                          </IconButton>
                        </Tooltip>
                      )
                    }
                    
                    {onDelete && (
                      <Tooltip title="Supprimer">
                        <IconButton 
                          edge="end" 
                          aria-label="delete" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(message.id);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                )}
              </ListItem>
              {index < messages.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))
        )}
      </List>
    </Paper>
  );
};

export default MessageList; 