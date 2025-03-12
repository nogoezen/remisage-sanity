export default {
  name: 'notification',
  title: 'Notification',
  type: 'document',
  fields: [
    {
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Vehicle Assignment', value: 'vehicle_assignment' },
          { title: 'Location Change', value: 'location_change' },
          { title: 'Request Update', value: 'request_update' },
          { title: 'Message Received', value: 'message_received' },
          { title: 'Maintenance Alert', value: 'maintenance_alert' }
        ],
        layout: 'dropdown'
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'message',
      title: 'Message',
      type: 'text',
      rows: 3,
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'isRead',
      title: 'Is Read',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'relatedVehicle',
      title: 'Related Vehicle',
      type: 'reference',
      to: [{ type: 'vehicle' }],
      weak: true
    },
    {
      name: 'relatedRequest',
      title: 'Related Request',
      type: 'reference',
      to: [{ type: 'request' }],
      weak: true
    },
    {
      name: 'relatedMessage',
      title: 'Related Message',
      type: 'reference',
      to: [{ type: 'message' }],
      weak: true
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        timeStep: 15,
        calendarTodayLabel: 'Today'
      },
      readOnly: true
    }
  ],
  initialValue: {
    createdAt: (new Date()).toISOString()
  },
  preview: {
    select: {
      title: 'title',
      userName: 'user.firstName',
      userLastName: 'user.lastName',
      type: 'type',
      isRead: 'isRead',
      date: 'createdAt'
    },
    prepare({ title, userName, userLastName, type, isRead, date }: { 
      title: string, 
      userName: string, 
      userLastName: string, 
      type: string, 
      isRead: boolean, 
      date: string 
    }) {
      const notificationType = type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      return {
        title: `${title} ${isRead ? '(Read)' : '(Unread)'}`,
        subtitle: `To: ${userName} ${userLastName} - Type: ${notificationType} - ${new Date(date).toLocaleDateString()}`
      }
    }
  }
} 