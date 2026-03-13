<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeSalary extends Model
{
    /** @use HasFactory<\Database\Factories\EmployeeSalaryFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'employee_id',
        'salary_grade_id',
        'salary_template_id',
        'basic_salary',
        'allowances_total',
        'deductions_total',
        'net_salary',
        'payment_frequency',
        'effective_date',
        'status',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'basic_salary' => 'decimal:2',
            'allowances_total' => 'decimal:2',
            'deductions_total' => 'decimal:2',
            'net_salary' => 'decimal:2',
            'effective_date' => 'date',
        ];
    }

    /**
     * @return BelongsTo<Employee, EmployeeSalary>
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * @return BelongsTo<SalaryGrade, EmployeeSalary>
     */
    public function grade(): BelongsTo
    {
        return $this->belongsTo(SalaryGrade::class, 'salary_grade_id');
    }

    /**
     * @return BelongsTo<SalaryTemplate, EmployeeSalary>
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(SalaryTemplate::class, 'salary_template_id');
    }
}
