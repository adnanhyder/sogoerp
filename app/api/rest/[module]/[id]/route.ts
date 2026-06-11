import {
  allowedFields,
  assertEventAllowed,
  createDbClient,
  getRestApiContext,
  getRestModule,
  jsonError,
  logInboundEvent,
} from "@/lib/rest-api";

type RouteContext = {
  params: Promise<{ id: string; module: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id, module: moduleKey } = await context.params;
  const config = getRestModule(moduleKey);

  if (!config) {
    return jsonError(new Error("Unsupported REST module."), 404);
  }

  const client = await createDbClient();

  try {
    const apiContext = await getRestApiContext(client, request);
    assertEventAllowed(apiContext, moduleKey, "read");

    const { rows } = await client.query(
      `select * from public.${config.table} where id = $1 and organization_id = $2 limit 1`,
      [id, apiContext.organizationId],
    );

    if (!rows[0]) {
      return jsonError(new Error("Record not found."), 404);
    }

    return Response.json({ data: rows[0] });
  } catch (error) {
    const status = error instanceof Error && error.message.includes("Missing API key") ? 401 : 400;
    return jsonError(error, status);
  } finally {
    await client.end();
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id, module: moduleKey } = await context.params;
  const config = getRestModule(moduleKey);

  if (!config) {
    return jsonError(new Error("Unsupported REST module."), 404);
  }

  const client = await createDbClient();

  try {
    const apiContext = await getRestApiContext(client, request);
    assertEventAllowed(apiContext, moduleKey, "update");

    const body = (await request.json()) as Record<string, unknown>;
    const payload = allowedFields(config, body);
    const columns = Object.keys(payload);
    const values = Object.values(payload);

    if (!columns.length) {
      return jsonError(new Error("No valid fields were provided."), 400);
    }

    const assignments = columns.map((column, index) => `${column} = $${index + 1}`).join(", ");
    values.push(id, apiContext.organizationId);

    const { rows } = await client.query(
      `update public.${config.table}
       set ${assignments}
       where id = $${values.length - 1} and organization_id = $${values.length}
       returning *`,
      values,
    );

    if (!rows[0]) {
      return jsonError(new Error("Record not found."), 404);
    }

    await logInboundEvent(client, apiContext, moduleKey, "update", { id, ...payload });

    return Response.json({ data: rows[0] });
  } catch (error) {
    const status = error instanceof Error && error.message.includes("Missing API key") ? 401 : 400;
    return jsonError(error, status);
  } finally {
    await client.end();
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id, module: moduleKey } = await context.params;
  const config = getRestModule(moduleKey);

  if (!config) {
    return jsonError(new Error("Unsupported REST module."), 404);
  }

  const client = await createDbClient();

  try {
    const apiContext = await getRestApiContext(client, request);
    assertEventAllowed(apiContext, moduleKey, "delete");

    const { rows } = await client.query(
      `delete from public.${config.table}
       where id = $1 and organization_id = $2
       returning id`,
      [id, apiContext.organizationId],
    );

    if (!rows[0]) {
      return jsonError(new Error("Record not found."), 404);
    }

    await logInboundEvent(client, apiContext, moduleKey, "delete", { id });

    return Response.json({ ok: true, id });
  } catch (error) {
    const status = error instanceof Error && error.message.includes("Missing API key") ? 401 : 400;
    return jsonError(error, status);
  } finally {
    await client.end();
  }
}
