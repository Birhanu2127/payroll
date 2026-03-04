<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $plainTextToken = $request->bearerToken();

        if (! $plainTextToken) {
            return new JsonResponse(['message' => 'Unauthenticated.'], 401);
        }

        $tokenHash = hash('sha256', $plainTextToken);
        $tokenRecord = DB::table('api_tokens')
            ->where('token_hash', $tokenHash)
            ->first();

        if (! $tokenRecord) {
            return new JsonResponse(['message' => 'Unauthenticated.'], 401);
        }

        $user = User::find($tokenRecord->user_id);

        if (! $user) {
            DB::table('api_tokens')->where('id', $tokenRecord->id)->delete();

            return new JsonResponse(['message' => 'Unauthenticated.'], 401);
        }

        Auth::setUser($user);
        $request->setUserResolver(fn (): User => $user);

        DB::table('api_tokens')
            ->where('id', $tokenRecord->id)
            ->update([
                'last_used_at' => now(),
                'updated_at' => now(),
            ]);

        return $next($request);
    }
}
