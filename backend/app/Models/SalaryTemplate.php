<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalaryTemplate extends Model
{
    /** @use HasFactory<\Database\Factories\SalaryTemplateFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'basic_salary',
        'total_earnings',
        'total_deductions',
        'net_salary',
        'description',
        'status',
        'created_date',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'basic_salary' => 'decimal:2',
            'total_earnings' => 'decimal:2',
            'total_deductions' => 'decimal:2',
            'net_salary' => 'decimal:2',
            'created_date' => 'date',
        ];
    }

    /**
     * @return HasMany<SalaryTemplateItem>
     */
    public function items(): HasMany
    {
        return $this->hasMany(SalaryTemplateItem::class);
    }
}
