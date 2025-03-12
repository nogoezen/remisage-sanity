export default {
  name: 'vehicle',
  title: 'Vehicle',
  type: 'document',
  fields: [
    {
      name: 'model',
      title: 'Model',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'licensePlate',
      title: 'License Plate',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      options: {
        isUnique: true
      }
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Available', value: 'available' },
          { title: 'Assigned', value: 'assigned' },
          { title: 'Maintenance', value: 'maintenance' }
        ],
        layout: 'radio'
      },
      initialValue: 'available',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'address',
      title: 'Address',
      type: 'string'
    },
    {
      name: 'location',
      title: 'Location',
      type: 'geopoint'
    },
    {
      name: 'assignedTo',
      title: 'Assigned To',
      type: 'reference',
      to: [{ type: 'user' }],
      weak: true
    }
  ],
  preview: {
    select: {
      title: 'model',
      subtitle: 'licensePlate',
      status: 'status'
    },
    prepare({ title, subtitle, status }: { title: string, subtitle: string, status: string }) {
      return {
        title: `${title} (${subtitle})`,
        subtitle: `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`
      }
    }
  }
} 