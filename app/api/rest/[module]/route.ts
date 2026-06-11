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
  params: Promise<{ module: string }>;
};

function pageRange(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? "25") || 25));
  return { limit: pageSize, offset: (page - 1) * pageSize, page, pageSize };
}

export async function GET(request: Request, context: RouteContext) {
  const { module: moduleKey } = await context.params;
  const config = getRestModule(moduleKey);

  if (!config) {
    return jsonError(new Error("Unsupported REST module."), 404);
  }

  const client = await createDbClient();

  try {
    const apiContext = await getRestApiContext(client, request);
    assertEventAllowed(apiContext, moduleKey, "read");

    const url = new URL(request.url);
    const { limit, offset, page, pageSize } = pageRange(url);
    const query = url.searchParams.get("q")?.trim();
    const values: unknown[] = [apiContext.organizationId];
    let where = "organization_id = $1";

    if (query && config.searchable?.length) {
      const searchParts = config.searchable.map((field) => {
        values.push(`%${query}%`);
        return `${field}::text ilike $${values.length}`;
      });
      where += ` and (${searchParts.join(" or ")})`;
    }

    values.push(limit, offset);
    const { rows } = await client.query(
      `select * from public.${config.table}
       where ${where}
       order by ${config.defaultOrder ?? "created_at"} desc
       limit $${values.length - 1} offset $${values.length}`,
      values,
    );

    return Response.json({ data: rows, page, pageSize });
  } catch (error) {
    const status = error instanceof Error && error.message.includes("Missing API key") ? 401 : 400;
    return jsonError(error, status);
  } finally {
    await client.end();
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { module: moduleKey } = await context.params;
  const config = getRestModule(moduleKey);

  if (!config) {
    return jsonError(new Error("Unsupported REST module."), 404);
  }

  const client = await createDbClient();

  try {
    const apiContext = await getRestApiContext(client, request);
    assertEventAllowed(apiContext, moduleKey, "create");

    const body = (await request.json()) as Record<string, unknown>;
    const payload = {
      ...allowedFields(config, body),
      organization_id: apiContext.organizationId,
    };
    const columns = Object.keys(payload);
    const values = Object.values(payload);

    if (!columns.length) {
      return jsonError(new Error("No valid fields were provided."), 400);
    }

    const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
    const { rows } = await client.query(
      `insert into public.${config.table} (${columns.join(", ")})
       values (${placeholders})
       returning *`,
      values,
    );

    await logInboundEvent(client, apiContext, moduleKey, "create", payload);

    return Response.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    const status = error instanceof Error && error.message.includes("Missing API key") ? 401 : 400;
    return jsonError(error, status);
  } finally {
    await client.end();
  }
}
