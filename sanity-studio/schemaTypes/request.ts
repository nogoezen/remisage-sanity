export default {
  name: 'request',
  title: 'Request',
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
          { title: 'Vehicle Change', value: 'vehicle_change' },
          { title: 'Location Change', value: 'location_change' },
          { title: 'Schedule Change', value: 'schedule_change' },
          { title: 'Maintenance', value: 'maintenance' },
          { title: 'Other', value: 'other' }
        ],
        layout: 'radio'
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'details',
      title: 'Details',
      type: 'text',
      rows: 5,
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'vehicle',
      title: 'Vehicle',
      type: 'reference',
      to: [{ type: 'vehicle' }],
      weak: true
    },
    {
      name: 'requestedDate',
      title: 'Requested Date',
      type: 'date',
      options: {
        dateFormat: 'YYYY-MM-DD',
        calendarTodayLabel: 'Today'
      }
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Approved', value: 'approved' },
          { title: 'Rejected', value: 'rejected' },
          { title: 'Completed', value: 'completed' }
        ],
        layout: 'radio'
      },
      initialValue: 'pending',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'adminResponse',
      title: 'Admin Response',
      type: 'text',
      rows: 3
    },
    {
      name: 'resolvedBy',
      title: 'Resolved By',
      type: 'reference',
      to: [{ type: 'user' }],
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
    },
    {
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        timeStep: 15,
        calendarTodayLabel: 'Today'
      }
    }
  ],
  initialValue: {
    createdAt: (new Date()).toISOString(),
    updatedAt: (new Date()).toISOString()
  },
  preview: {
    select: {
      title: 'type',
      userName: 'user.firstName',
      userLastName: 'user.lastName',
      status: 'status',
      date: 'createdAt'
    },
    prepare({ title, userName, userLastName, status, date }: { 
      title: string, 
      userName: string, 
      userLastName: string, 
      status: string, 
      date: string 
    }) {
      const requestType = title.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      return {
        title: `${requestType} Request`,
        subtitle: `By: ${userName} ${userLastName} - Status: ${status.charAt(0).toUpperCase() + status.slice(1)} - ${new Date(date).toLocaleDateString()}`
      }
    }
  }
} 