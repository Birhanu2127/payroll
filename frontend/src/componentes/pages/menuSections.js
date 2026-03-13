export const menuSections = [
  {
    icon: 'DB',
    title: 'Dashboard',
    items: ['Overview', 'Payroll Analytics', 'Monthly Summary', 'System Notification'],
  },
  {
    icon: 'EM',
    title: 'Employee Management',
    items: [
      'All Employees',
      'Add Employee',
      'Departments',
      'Job Positions',
      'Employment Types',
      'Bank Account Details',
      'Employee Status (Active/Inactive)',
    ],
  },
  {
    icon: 'SS',
    title: 'Salary Structure',
    items: [
      'Salary Grades',
      'Salary Templates',
      'Assign Salary to Employee',
      'Salary History',
      'Bulk Salary Update',
    ],
  },
  {
    icon: 'AL',
    title: 'Allowances Management',
    items: [
      'Allowance Types (Transport, Housing, Bonus)',
      'Fixed Allowances',
      'Variable Allowances',
      'Performance Bonus',
      'Overtime Configuration',
    ],
  },
  {
    icon: 'DE',
    title: 'Deductions Management',
    items: [
      'Deduction Types (Loan, Penalty, Insurance)',
      'Loan Management',
      'Recurring Deductions',
      'One-time Deductions',
      'Late/Absent Penalty Rules',
    ],
  },
  {
    icon: 'TX',
    title: 'Tax Management',
    items: [
      'Tax Rules Setup',
      'Tax Brackets',
      'Government Contributions',
      'Pension Settings',
      'Tax Reports',
    ],
  },
  {
    icon: 'PR',
    title: 'Payroll Processing',
    items: [
      'Generate Payroll',
      'View Generated Payroll',
      'Edit Payroll',
      'Approve Payroll',
      'Lock Payroll',
      'Reopen Payroll',
      'Payroll History',
    ],
  },
  {
    icon: 'PS',
    title: 'Payslips',
    items: ['Generate Payslips', 'Bulk Download (PDF)', 'Email Payslips', 'Payslip Templates'],
  },
  {
    icon: 'BK',
    title: 'Bank Integration',
    items: ['Bank File Export', 'Payment Batch List', 'Payment Status', 'Bank Format Settings'],
  },
  {
    icon: 'RP',
    title: 'Reports & Analytics',
    items: [
      'Monthly Payroll Summary',
      'Net vs Gross Report',
      'Department Salary Cost',
      'Tax Deduction Report',
      'Overtime Cost Report',
      'Allowance Breakdown',
      'Deduction Breakdown',
      'Employee Salary History',
    ],
  },
  {
    icon: 'AP',
    title: 'Approvals & Workflow',
    items: [
      'Pending Approvals',
      'Approval History',
      'Multi-Level Approval Setup',
      'Workflow Settings',
    ],
  },
  {
    icon: 'ST',
    title: 'System Settings',
    items: [
      'Company Information',
      'Payroll Settings',
      'Working Days Configuration',
      'Currency Settings',
      'Financial Year Setup',
      'Email Settings',
      'Notification Settings',
      'Backup & Restore',
    ],
  },
  {
    icon: 'RL',
    title: 'Role & Permission Management',
    items: ['Manage Roles', 'Assign Permissions', 'User Accounts', 'Activity Logs'],
  },
  {
    icon: 'LG',
    title: 'Audit & Logs',
    items: ['Payroll Audit Trail', 'User Activity Logs', 'System Logs', 'Error Logs'],
  },
]

export const fallbackOverview = [
  { label: 'Active Employees', value: 0, hint: 'Waiting for API' },
  { label: 'Pending Payroll Runs', value: 0, hint: 'Waiting for API' },
  { label: 'Approvals Waiting', value: 0, hint: 'Waiting for API' },
  { label: 'Monthly Net Payout', value: 0, hint: 'Waiting for API' },
]
