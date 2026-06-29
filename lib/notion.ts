import { Client } from "@notionhq/client";

if (!process.env.NOTION_TOKEN) {
  throw new Error("Missing NOTION_TOKEN environment variable");
}

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const databaseId = process.env.NOTION_DATABASE_ID!;

export async function getHotels() {
  const results = [];
  let cursor: string | undefined = undefined;

  while (true) {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ property: "Name", direction: "ascending" }],
      start_cursor: cursor,
      page_size: 100,
    });

    results.push(...response.results);

    if (!response.has_more) break;
    cursor = response.next_cursor ?? undefined;
  }

  return results.map((page: any) => {
    const props = (page as any).properties;
    return {
      id: page.id,
      name: props.Name?.title?.[0]?.plain_text ?? "",
      region: props.Region?.select?.name ?? "",
      country: props.Country?.select?.name ?? "",
      stateArea: props["State/Area"]?.select?.name ?? "",
      city: props["City/Location"]?.rich_text?.[0]?.plain_text ?? "",
      status: props.Status?.select?.name ?? "",
      notes: props.Notes?.rich_text?.[0]?.plain_text ?? "",
      url: props.URL?.url ?? "",
    };
  });
}

export type Hotel = Awaited<ReturnType<typeof getHotels>>[number];
