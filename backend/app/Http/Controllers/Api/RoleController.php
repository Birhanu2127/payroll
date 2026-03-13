<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $this->seedDefaults();

        $roles = Role::orderBy('level')->orderBy('name')->get();

        return response()->json([
            'data' => $roles->map(fn (Role $role) => $this->serialize($role)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);
        $payload = $this->mapPayload($validated);
        $payload['status'] ??= 'Active';

        $role = Role::create($payload);

        $this->logAction($request, 'Created Role', 'Role Management');

        return response()->json([
            'data' => $this->serialize($role),
        ], 201);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $validated = $this->validatePayload($request, true);
        $payload = $this->mapPayload($validated);

        if (! empty($payload)) {
            $role->fill($payload);
            $role->save();
        }

        $this->logAction($request, 'Updated Role', 'Role Management');

        return response()->json([
            'data' => $this->serialize($role->fresh()),
        ]);
    }

    public function destroy(Request $request, Role $role): JsonResponse
    {
        $role->delete();

        $this->logAction($request, 'Deleted Role', 'Role Management');

        return response()->json([], 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:255', Rule::unique('roles', 'name')->ignore($request->route('role'))],
            'description' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:255'],
            'level' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'integer', 'min:1'],
            'status' => [$partial ? 'sometimes' : 'nullable', 'nullable', Rule::in(['Active', 'Inactive'])],
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function mapPayload(array $validated): array
    {
        $payload = [];
        $this->setIfPresent($payload, $validated, 'name', 'name');
        $this->setIfPresent($payload, $validated, 'description', 'description');
        $this->setIfPresent($payload, $validated, 'level', 'level');
        $this->setIfPresent($payload, $validated, 'status', 'status');

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Role $role): array
    {
        return [
            'id' => $role->id,
            'name' => $role->name,
            'description' => $role->description,
            'level' => $role->level,
            'status' => $role->status,
            'createdDate' => $role->created_at?->toDateTimeString(),
            'updatedDate' => $role->updated_at?->toDateTimeString(),
        ];
    }

    private function seedDefaults(): void
    {
        if (Role::query()->exists()) {
            return;
        }

        $defaults = [
            ['name' => 'Admin', 'description' => 'Full system access', 'level' => 1],
            ['name' => 'HR Manager', 'description' => 'Manage employees', 'level' => 2],
            ['name' => 'Supervisor', 'description' => 'Approve requests', 'level' => 3],
            ['name' => 'Accountant', 'description' => 'Payroll and finance access', 'level' => 4],
            ['name' => 'Employee', 'description' => 'Limited access', 'level' => 5],
        ];

        foreach ($defaults as $role) {
            Role::create([
                'name' => $role['name'],
                'description' => $role['description'],
                'level' => $role['level'],
                'status' => 'Active',
            ]);
        }
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

    /**
     * @param  array<string, mixed>  $target
     * @param  array<string, mixed>  $source
     */
    private function setIfPresent(array &$target, array $source, string $sourceKey, string $targetKey): void
    {
        if (array_key_exists($sourceKey, $source)) {
            $target[$targetKey] = $source[$sourceKey];
        }
    }
}
