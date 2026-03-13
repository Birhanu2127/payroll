<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    /** @use HasFactory<\Database\Factories\EmployeeFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'employee_id',
        'email',
        'phone',
        'department',
        'position',
        'employment_type',
        'join_date',
        'status',
        'attendance',
        'gender',
        'date_of_birth',
        'address',
        'manager',
        'role',
        'avatar_hue',
        'created_date',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'join_date' => 'date',
            'date_of_birth' => 'date',
            'created_date' => 'date',
        ];
    }
}
