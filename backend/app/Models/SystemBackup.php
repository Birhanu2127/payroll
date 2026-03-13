<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemBackup extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'backup_type',
        'storage_driver',
        'file_name',
        'size_mb',
        'status',
        'created_by',
        'restored_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size_mb' => 'float',
            'restored_at' => 'datetime',
        ];
    }
}
