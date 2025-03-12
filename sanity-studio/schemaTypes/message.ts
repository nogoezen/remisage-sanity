export default {
  name: 'message',
  title: 'Message',
  type: 'document',
  fields: [
    {
      name: 'sender',
      title: 'Sender',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'receiver',
      title: 'Receiver',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'subject',
      title: 'Subject',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'content',
      title: 'Content',
      type: 'text',
      rows: 5,
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'isRead',
      title: 'Is Read',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'isArchived',
      title: 'Is Archived',
      type: 'boolean',
      initialValue: false
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
      title: 'subject',
      senderName: 'sender.firstName',
      senderLastName: 'sender.lastName',
      receiverName: 'receiver.firstName',
      receiverLastName: 'receiver.lastName',
      date: 'createdAt'
    },
    prepare({ title, senderName, senderLastName, receiverName, receiverLastName, date }: { 
      title: string, 
      senderName: string, 
      senderLastName: string, 
      receiverName: string, 
      receiverLastName: string, 
      date: string 
    }) {
      return {
        title,
        subtitle: `From: ${senderName} ${senderLastName} To: ${receiverName} ${receiverLastName} - ${new Date(date).toLocaleDateString()}`
      }
    }
  }
} 