export default {
  name: 'user',
  title: 'User',
  type: 'document',
  fields: [
    {
      name: 'firstName',
      title: 'First Name',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'lastName',
      title: 'Last Name',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule: any) => Rule.required().email(),
      options: {
        isUnique: true
      }
    },
    {
      name: 'password',
      title: 'Password',
      type: 'string',
      hidden: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: [
          { title: 'Admin', value: 'admin' },
          { title: 'Employee', value: 'employee' }
        ],
        layout: 'radio'
      },
      initialValue: 'employee',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'has_vehicle_assigned',
      title: 'Has Vehicle Assigned',
      type: 'boolean',
      initialValue: true
    }
  ],
  preview: {
    select: {
      title: 'firstName',
      subtitle: 'lastName',
      email: 'email'
    },
    prepare({ title, subtitle, email }: { title: string, subtitle: string, email: string }) {
      return {
        title: `${title} ${subtitle}`,
        subtitle: email
      }
    }
  }
} 