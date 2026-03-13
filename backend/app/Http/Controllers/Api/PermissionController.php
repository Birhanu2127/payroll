<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function index(): JsonResponse
    {
        $this->seedDefaults();

        $permissions = Permission::orderBy('module')->orderBy('action')->get();

        return response()->json([
            'data' => $permissions->map(fn (Permission $permission) => $this->serialize($permission)),
        ]);
    }

    public function rolePermissions(Role $role): JsonResponse
    {
        $permissionIds = $role->permissions()->pluck('permissions.id')->all();

        return response()->json([
            'data' => [
                'roleId' => $role->id,
                'permissionIds' => $permissionIds,
            ],
        ]);
    }

    public function updateRolePermissions(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'permissionIds' => ['array'],
            'permissionIds.*' => ['integer', 'exists:permissions,id'],
        ]);

        $permissionIds = $validated['permissionIds'] ?? [];
        $role->permissions()->sync($permissionIds);

        $this->logAction($request, 'Updated Role Permissions', 'Role Permissions');

        return response()->json([
            'data' => [
                'roleId' => $role->id,
                'permissionIds' => $permissionIds,
            ],
        ]);
    }

    private function seedDefaults(): void
    {
        if (Permission::query()->exists()) {
            return;
        }

        $defaults = [
            ['module' => 'Employee Management', 'action' => 'View', 'label' => 'View Employees'],
            ['module' => 'Employee Management', 'action' => 'Create', 'label' => 'Add Employee'],
            ['module' => 'Employee Management', 'action' => 'Edit', 'label' => 'Edit Employee'],
            ['module' => 'Employee Management', 'action' => 'Delete', 'label' => 'Delete Employee'],
            ['module' => 'Attendance Management', 'action' => 'View', 'label' => 'View Attendance'],
            ['module' => 'Attendance Management', 'action' => 'Edit', 'label' => 'Edit Attendance'],
            ['module' => 'Attendance Management', 'action' => 'Approve', 'label' => 'Approve Corrections'],
            ['module' => 'Leave Management', 'action' => 'View', 'label' => 'View Leave'],
            ['module' => 'Leave Management', 'action' => 'Create', 'label' => 'Apply Leave'],
            ['module' => 'Leave Management', 'action' => 'Edit', 'label' => 'Edit Leave'],
            ['module' => 'Leave Management', 'action' => 'Approve', 'label' => 'Approve Leave'],
            ['module' => 'Payroll', 'action' => 'Generate', 'label' => 'Generate Payroll'],
            ['module' => 'Payroll', 'action' => 'View', 'label' => 'View Payslips'],
            ['module' => 'Payroll', 'action' => 'Export', 'label' => 'Export Payroll'],
            ['module' => 'Reports & Analytics', 'action' => 'View', 'label' => 'View Reports'],
            ['module' => 'Reports & Analytics', 'action' => 'Export', 'label' => 'Export Reports'],
        ];

        foreach ($defaults as $permission) {
            Permission::create([
                'module' => $permission['module'],
                'action' => $permission['action'],
                'label' => $permission['label'],
                'description' => $permission['label'],
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Permission $permission): array
    {
        return [
            'id' => $permission->id,
            'module' => $permission->module,
            'action' => $permission->action,
            'label' => $permission->label,
            'description' => $permission->description,
        ];
    }

    private function logAction(Request $request, string $action, string $module): void
    {
        $user = $request->user();

        ActivityLog::create([
            'user_id' => $user?->id,
            'user_name' => $user?->name,
            'role_name' => $user?->role,
            'action' => $action,
            'module' => $module,
            'ip_address' => $request->ip(),
            'device' => $request->header('User-Agent'),
            'user_agent' => $request->header('User-Agent'),
            'created_at' => now(),
        ]);
    }
}
