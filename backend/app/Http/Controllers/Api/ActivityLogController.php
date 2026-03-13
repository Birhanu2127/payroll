<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ActivityLog::query()->orderByDesc('created_at');

        if ($request->filled('userId')) {
            $query->where('user_id', $request->input('userId'));
        }

        if ($request->filled('module')) {
            $query->where('module', $request->input('module'));
        }

        if ($request->filled('action')) {
            $query->where('action', $request->input('action'));
        }

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->input('to'));
        }

        $logs = $query->get();

        return response()->json([
            'data' => $logs->map(fn (ActivityLog $log) => [
                'id' => $log->id,
                'userId' => $log->user_id,
                'userName' => $log->user_name,
                'roleName' => $log->role_name,
                'action' => $log->action,
                'module' => $log->module,
                'ipAddress' => $log->ip_address,
                'device' => $log->device,
                'createdDate' => $log->created_at?->toDateTimeString(),
            ]),
        ]);
    }
}
