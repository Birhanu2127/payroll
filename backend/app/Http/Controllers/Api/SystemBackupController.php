<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemBackup;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemBackupController extends Controller
{
    public function index(): JsonResponse
    {
        $backups = SystemBackup::orderByDesc('id')->get();

        return response()->json([
            'data' => $backups->map(fn (SystemBackup $backup) => $this->serialize($backup)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'backupType' => ['sometimes', 'nullable', 'string', 'max:50'],
            'storageDriver' => ['sometimes', 'nullable', 'string', 'max:50'],
        ]);

        $backupType = $validated['backupType'] ?? 'Database';
        $storageDriver = $validated['storageDriver'] ?? 'Local';
        $timestamp = now()->format('Ymd-His');
        $fileName = strtolower(str_replace(' ', '-', $backupType))."-{$timestamp}.bak";

        $backup = SystemBackup::create([
            'backup_type' => $backupType,
            'storage_driver' => $storageDriver,
            'file_name' => $fileName,
            'size_mb' => random_int(40, 180) / 1.0,
            'status' => 'Completed',
            'created_by' => $request->user()?->id,
        ]);

        return response()->json([
            'data' => $this->serialize($backup),
        ], 201);
    }

    public function restore(SystemBackup $systemBackup): JsonResponse
    {
        $systemBackup->status = 'Restored';
        $systemBackup->restored_at = now();
        $systemBackup->save();

        return response()->json([
            'data' => $this->serialize($systemBackup->fresh()),
        ]);
    }

    public function download(SystemBackup $systemBackup)
    {
        $content = "Backup {$systemBackup->id} ({$systemBackup->backup_type}) - generated {$systemBackup->created_at}";

        return response()->streamDownload(function () use ($content): void {
            echo $content;
        }, $systemBackup->file_name ?? "backup-{$systemBackup->id}.txt");
    }

    public function destroy(SystemBackup $systemBackup): JsonResponse
    {
        $systemBackup->delete();

        return response()->json([], 204);
    }

    public function prune(Request $request): JsonResponse
    {
        $days = $request->integer('days');
        $settings = SystemSetting::query()->first();
        $retentionDays = $days ?: ($settings?->backup_retention_days ?? 30);
        $cutoff = now()->subDays($retentionDays);

        $oldBackups = SystemBackup::where('created_at', '<', $cutoff)->get();
        $deletedIds = $oldBackups->pluck('id')->all();
        $deletedCount = 0;

        if (! empty($deletedIds)) {
            $deletedCount = SystemBackup::whereIn('id', $deletedIds)->delete();
        }

        return response()->json([
            'data' => [
                'deleted' => $deletedCount,
                'deletedIds' => $deletedIds,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(SystemBackup $backup): array
    {
        return [
            'id' => $backup->id,
            'backupType' => $backup->backup_type,
            'storageDriver' => $backup->storage_driver,
            'fileName' => $backup->file_name,
            'sizeMb' => $backup->size_mb,
            'status' => $backup->status,
            'restoredAt' => $backup->restored_at?->toDateTimeString(),
            'createdDate' => $backup->created_at?->toDateTimeString(),
        ];
    }
}
