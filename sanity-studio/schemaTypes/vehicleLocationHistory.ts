export default {
  name: 'vehicleLocationHistory',
  title: 'Vehicle Location History',
  type: 'document',
  fields: [
    {
      name: 'vehicle',
      title: 'Vehicle',
      type: 'reference',
      to: [{ type: 'vehicle' }],
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'address',
      title: 'Address',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'location',
      title: 'Location',
      type: 'geopoint',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'updatedBy',
      title: 'Updated By',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      validation: (Rule: any) => Rule.required(),
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        timeStep: 15,
        calendarTodayLabel: 'Today'
      }
    }
  ],
  preview: {
    select: {
      vehicleTitle: 'vehicle.model',
      vehiclePlate: 'vehicle.licensePlate',
      address: 'address',
      date: 'createdAt'
    },
    prepare({ vehicleTitle, vehiclePlate, address, date }: { vehicleTitle: string, vehiclePlate: string, address: string, date: string }) {
      return {
        title: vehicleTitle ? `${vehicleTitle} (${vehiclePlate})` : 'Vehicle location update',
        subtitle: `${address} - ${new Date(date).toLocaleDateString()}`
      }
    }
  }
} 