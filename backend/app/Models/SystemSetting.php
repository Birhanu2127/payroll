<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'company_name',
        'company_logo_path',
        'company_email',
        'company_phone',
        'company_address',
        'country',
        'city',
        'postal_code',
        'tax_identification_number',
        'company_registration_number',
        'website',
        'default_salary_type',
        'payroll_processing_day',
        'overtime_calculation_method',
        'tax_calculation_method',
        'allow_negative_leave_balance',
        'salary_rounding_rules',
        'automatic_payroll_generation',
        'payslip_format',
        'working_days',
        'weekend_days',
        'daily_working_hours',
        'shift_start_time',
        'shift_end_time',
        'break_time_minutes',
        'overtime_start_after_hours',
        'default_currency',
        'currency_symbol',
        'currency_code',
        'decimal_format',
        'currency_position',
        'exchange_rate',
        'mail_driver',
        'smtp_host',
        'smtp_port',
        'smtp_username',
        'smtp_password',
        'encryption_type',
        'from_email_address',
        'from_name',
        'enable_email_notifications',
        'enable_system_notifications',
        'leave_request_alerts',
        'payroll_generation_alerts',
        'overtime_request_alerts',
        'attendance_alerts',
        'backup_auto_enabled',
        'backup_frequency',
        'backup_type',
        'backup_storage_driver',
        'backup_retention_days',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'allow_negative_leave_balance' => 'boolean',
            'automatic_payroll_generation' => 'boolean',
            'enable_email_notifications' => 'boolean',
            'enable_system_notifications' => 'boolean',
            'leave_request_alerts' => 'boolean',
            'payroll_generation_alerts' => 'boolean',
            'overtime_request_alerts' => 'boolean',
            'attendance_alerts' => 'boolean',
            'backup_auto_enabled' => 'boolean',
            'working_days' => 'array',
            'weekend_days' => 'array',
        ];
    }
}
