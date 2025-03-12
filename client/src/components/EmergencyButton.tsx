import React, { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  Fab,
  Tooltip,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import WarningIcon from '@mui/icons-material/Warning';
import { red } from '@mui/material/colors';

interface EmergencyButtonProps {
  phoneNumber?: string;
  onCall?: () => void;
}

const EmergencyButton: React.FC<EmergencyButtonProps> = ({ 
  phoneNumber = '112', // Numéro d'urgence européen par défaut
  onCall 
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calling, setCalling] = useState(false);

  const handleClick = () => {
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  const handleCall = () => {
    setCalling(true);
    
    // Simuler un délai avant l'appel
    setTimeout(() => {
      setCalling(false);
      setDialogOpen(false);
      
      // Appeler le numéro d'urgence
      window.location.href = `tel:${phoneNumber}`;
      
      // Déclencher le callback si fourni
      if (onCall) {
        onCall();
      }
    }, 1000);
  };

  return (
    <>
      <Tooltip title="Appel d'urgence" placement="left">
        <Fab
          color="error"
          aria-label="emergency"
          onClick={handleClick}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            boxShadow: 3,
            '&:hover': {
              backgroundColor: red[700]
            }
          }}
        >
          <PhoneIcon />
        </Fab>
      </Tooltip>

      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        aria-labelledby="emergency-dialog-title"
        aria-describedby="emergency-dialog-description"
      >
        <DialogTitle id="emergency-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
          <WarningIcon color="error" sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            Appel d'urgence
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="emergency-dialog-description">
            Vous êtes sur le point d'appeler le numéro d'urgence ({phoneNumber}).
            Confirmez-vous vouloir passer cet appel ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Annuler
          </Button>
          <Button 
            onClick={handleCall} 
            color="error" 
            variant="contained"
            disabled={calling}
            startIcon={calling ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {calling ? 'Appel en cours...' : 'Appeler maintenant'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EmergencyButton; 