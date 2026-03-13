<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalaryBulkUpdate extends Model
{
    /** @use HasFactory<\Database\Factories\SalaryBulkUpdateFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'department',
        'salary_grade_id',
        'increase_type',
        'increase_value',
        'effective_date',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'increase_value' => 'decimal:2',
            'effective_date' => 'date',
        ];
    }

    /**
     * @return BelongsTo<SalaryGrade, SalaryBulkUpdate>
     */
    public function grade(): BelongsTo
    {
        return $this->belongsTo(SalaryGrade::class, 'salary_grade_id');
    }
}
