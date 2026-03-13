<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalaryTemplateItem extends Model
{
    /** @use HasFactory<\Database\Factories\SalaryTemplateItemFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'salary_template_id',
        'type',
        'name',
        'amount',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<SalaryTemplate, SalaryTemplateItem>
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(SalaryTemplate::class, 'salary_template_id');
    }
}
