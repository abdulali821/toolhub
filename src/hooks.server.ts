import type { Handle, HandleServerError } from '@sveltejs/kit';
import { validateEnv } from '$server/env';
import { createLogger } from '$server/logger';
import { createSupabaseServerClient } from '$lib/supabase/server';

validateEnv();

export const handle: Handle = async ({ event, resolve }) => {
	const requestId = crypto.randomUUID();
	event.locals.requestId = requestId;
	event.locals.log = createLogger({ requestId });

	event.locals.supabase = createSupabaseServerClient(event.cookies);

	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();

	event.locals.user = user;

	const {
		data: { session }
	} = await event.locals.supabase.auth.getSession();
	event.locals.session = session;

	if (event.locals.user) {
		event.locals.log = event.locals.log.child({ userId: event.locals.user.id });
	}

	const response = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});

	response.headers.set('x-request-id', requestId);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Frame-Options', 'SAMEORIGIN');
	// HSTS belongs on the HTTPS edge (Nginx/Caddy). App sets it only when the
	// request already arrived over TLS so local http:// preview stays usable.
	if (event.url.protocol === 'https:') {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}
	return response;
};

export const handleError: HandleServerError = ({ error, event, status, message }) => {
	event.locals.log?.error('unhandled_error', {
		err: error,
		status,
		path: event.url.pathname
	});

	return {
		message: status === 404 ? message : 'Something went wrong.',
		code: status === 404 ? 'not_found' : 'internal_error'
	};
};
