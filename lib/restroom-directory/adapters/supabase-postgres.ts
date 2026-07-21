import type {
  AdminRestroomSummary,
  Establishment,
} from "@/lib/restroom-directory/schemas";
import type {
  CreateEstablishmentInput,
  CreateRestroomInput,
  CreateRestroomPhotoInput,
  CreateReviewPhotoInput,
  DeleteRestroomOutcome,
  FindActiveNearParams,
  InsertReportInput,
  InsertReportOutcome,
  InsertVerifyInput,
  InsertVerifyOutcome,
  MergeRestroomsInput,
  MergeRestroomsOutcome,
  OpenReportRow,
  PostgresPort,
  RestroomDetailRow,
  SetRestroomStatusInput,
  SetRestroomStatusOutcome,
  SoftRemovePhotoInput,
  SoftRemovePhotoOutcome,
  StoredPhotoRow,
  UpdateEstablishmentInput,
  UpdateReportStatusInput,
  UpdateReportStatusOutcome,
  UpdateRestroomFieldsInput,
  UpdateRestroomFieldsOutcome,
  UpsertReviewOutcome,
  UpsertReviewPortInput,
} from "@/lib/restroom-directory/ports/postgres";
import type { NearbyRestroom, SiblingRestroom } from "@/lib/restroom-directory/schemas";
import {
  classifyPinVariant,
  hasBidetFromType,
  isCommunityVerified,
} from "@/lib/restroom-directory/pin-variant";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function notImplemented(method: string): never {
  throw new Error(`PostgresPort.${method} is not implemented for admin listings`);
}

type EstablishmentRow = {
  id: string;
  place_id: string;
  name: string;
  formatted_address: string | null;
  lat: number;
  lng: number;
};

type RestroomRow = {
  id: string;
  establishment_id: string;
  created_by: string | null;
  floor_area: string | null;
  restroom_label: string | null;
  bidet_type: RestroomDetailRow["bidetType"];
  has_tissue: boolean;
  has_soap: boolean;
  has_hand_drying: boolean;
  access_cost: RestroomDetailRow["accessCost"];
  access_scope: RestroomDetailRow["accessScope"];
  status: RestroomDetailRow["status"];
  verify_count: number;
  rating_avg: number | null;
  rating_count: number;
  created_at: string;
  updated_at: string;
};

type PhotoRow = {
  id: string;
  storage_path: string;
  sort_order: number;
};

function toEstablishment(row: EstablishmentRow): Establishment {
  return {
    id: row.id,
    placeId: row.place_id,
    name: row.name,
    formattedAddress: row.formatted_address,
    lat: row.lat,
    lng: row.lng,
  };
}

/** Soft-launch stand-in for PostGIS `ST_DWithin` (haversine on lat/lng). */
function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6_371_000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

type NearbyJoinRow = {
  id: string;
  establishment_id: string;
  floor_area: string | null;
  restroom_label: string | null;
  bidet_type: RestroomDetailRow["bidetType"];
  access_cost: RestroomDetailRow["accessCost"];
  access_scope: RestroomDetailRow["accessScope"];
  verify_count: number;
  rating_avg: number | null;
  rating_count: number;
  establishments:
    | { id: string; name: string; lat: number; lng: number }
    | { id: string; name: string; lat: number; lng: number }[]
    | null;
};

function establishmentFromJoin(
  row: NearbyJoinRow,
): { id: string; name: string; lat: number; lng: number } | null {
  const est = row.establishments;
  if (!est) return null;
  return Array.isArray(est) ? (est[0] ?? null) : est;
}

/**
 * Supabase-backed PostgresPort covering admin list + upsert + report queue
 * and Explore `listNearby` (active restrooms near a point).
 * Other methods throw until later tickets wire them.
 */
export function createSupabasePostgres(): PostgresPort {
  async function db(): Promise<SupabaseClient> {
    return createClient();
  }

  return {
    async findActiveRestroomsNear(
      params: FindActiveNearParams,
    ): Promise<NearbyRestroom[]> {
      const supabase = await db();
      const { data, error } = await supabase
        .from("restrooms")
        .select(
          "id, establishment_id, floor_area, restroom_label, bidet_type, access_cost, access_scope, verify_count, rating_avg, rating_count, establishments!inner(id, name, lat, lng)",
        )
        .eq("status", "active");

      if (error || !data) {
        return [];
      }

      const { lat, lng, radiusMeters, filters } = params;
      const origin = { lat, lng };

      return (data as NearbyJoinRow[])
        .map((row) => {
          const establishment = establishmentFromJoin(row);
          if (!establishment) return null;

          const hasBidet = hasBidetFromType(row.bidet_type);
          const communityVerified = isCommunityVerified(row.verify_count);
          const distanceMeters = haversineMeters(origin, {
            lat: establishment.lat,
            lng: establishment.lng,
          });

          const listing: NearbyRestroom = {
            id: row.id,
            establishmentId: row.establishment_id,
            name: establishment.name,
            lat: establishment.lat,
            lng: establishment.lng,
            distanceMeters,
            bidetType: row.bidet_type,
            hasBidet,
            accessCost: row.access_cost,
            accessScope: row.access_scope,
            verifyCount: row.verify_count,
            communityVerified,
            ratingAvg: row.rating_avg,
            ratingCount: row.rating_count,
            pinVariant: classifyPinVariant(row.bidet_type, row.verify_count),
            floorArea: row.floor_area,
            restroomLabel: row.restroom_label,
          };
          return listing;
        })
        .filter((r): r is NearbyRestroom => r !== null)
        .filter((r) => r.distanceMeters <= radiusMeters)
        .filter((r) => {
          if (!filters) return true;
          if (
            filters.hasBidet !== undefined &&
            r.hasBidet !== filters.hasBidet
          ) {
            return false;
          }
          if (
            filters.accessCost !== undefined &&
            r.accessCost !== filters.accessCost
          ) {
            return false;
          }
          if (
            filters.accessScope !== undefined &&
            r.accessScope !== filters.accessScope
          ) {
            return false;
          }
          if (
            filters.communityVerified !== undefined &&
            r.communityVerified !== filters.communityVerified
          ) {
            return false;
          }
          return true;
        })
        .sort((a, b) => a.distanceMeters - b.distanceMeters);
    },

    async findRestroomDetail(id: string): Promise<RestroomDetailRow | null> {
      const supabase = await db();
      const { data: restroom, error } = await supabase
        .from("restrooms")
        .select(
          "id, establishment_id, created_by, floor_area, restroom_label, bidet_type, has_tissue, has_soap, has_hand_drying, access_cost, access_scope, status, verify_count, rating_avg, rating_count, created_at, updated_at",
        )
        .eq("id", id)
        .maybeSingle();

      if (error || !restroom) return null;
      const row = restroom as RestroomRow;

      const { data: establishment, error: estError } = await supabase
        .from("establishments")
        .select("id, place_id, name, formatted_address, lat, lng")
        .eq("id", row.establishment_id)
        .maybeSingle();

      if (estError || !establishment) return null;

      const { data: photos } = await supabase
        .from("restroom_photos")
        .select("id, storage_path, sort_order")
        .eq("restroom_id", id)
        .is("removed_at", null)
        .order("sort_order", { ascending: true });

      return {
        id: row.id,
        establishment: toEstablishment(establishment as EstablishmentRow),
        floorArea: row.floor_area,
        restroomLabel: row.restroom_label,
        bidetType: row.bidet_type,
        hasTissue: row.has_tissue,
        hasSoap: row.has_soap,
        hasHandDrying: row.has_hand_drying,
        accessCost: row.access_cost,
        accessScope: row.access_scope,
        status: row.status,
        verifyCount: row.verify_count,
        ratingAvg: row.rating_avg === null ? null : Number(row.rating_avg),
        ratingCount: row.rating_count,
        createdBy: row.created_by,
        photos: ((photos ?? []) as PhotoRow[]).map((p) => ({
          id: p.id,
          storagePath: p.storage_path,
          sortOrder: p.sort_order,
        })),
        reviews: [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    },

    async findActiveSiblings(
      _restroomId: string,
    ): Promise<SiblingRestroom[] | null> {
      notImplemented("findActiveSiblings");
    },

    async findActiveRestroomsByPlaceId(
      _placeId: string,
    ): Promise<SiblingRestroom[]> {
      notImplemented("findActiveRestroomsByPlaceId");
    },

    async findEstablishmentByPlaceId(
      placeId: string,
    ): Promise<Establishment | null> {
      const supabase = await db();
      const { data, error } = await supabase
        .from("establishments")
        .select("id, place_id, name, formatted_address, lat, lng")
        .eq("place_id", placeId)
        .maybeSingle();

      if (error || !data) return null;
      return toEstablishment(data as EstablishmentRow);
    },

    async createEstablishment(
      input: CreateEstablishmentInput,
    ): Promise<Establishment> {
      const supabase = await db();
      const { data, error } = await supabase
        .from("establishments")
        .insert({
          place_id: input.placeId,
          name: input.name,
          formatted_address: input.formattedAddress,
          lat: input.lat,
          lng: input.lng,
        })
        .select("id, place_id, name, formatted_address, lat, lng")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "Failed to create establishment");
      }
      return toEstablishment(data as EstablishmentRow);
    },

    async createRestroom(
      input: CreateRestroomInput,
    ): Promise<{ id: string }> {
      const supabase = await db();
      const { data, error } = await supabase
        .from("restrooms")
        .insert({
          establishment_id: input.establishmentId,
          created_by: input.createdBy,
          floor_area: input.floorArea,
          restroom_label: input.restroomLabel,
          bidet_type: input.bidetType,
          has_tissue: input.hasTissue,
          has_soap: input.hasSoap,
          has_hand_drying: input.hasHandDrying,
          access_cost: input.accessCost,
          access_scope: input.accessScope,
          status: input.status ?? "active",
        })
        .select("id")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "Failed to create restroom");
      }
      return { id: (data as { id: string }).id };
    },

    async createRestroomPhoto(
      input: CreateRestroomPhotoInput,
    ): Promise<StoredPhotoRow> {
      const supabase = await db();
      const { data, error } = await supabase
        .from("restroom_photos")
        .insert({
          id: input.id,
          restroom_id: input.restroomId,
          uploaded_by: input.uploadedBy,
          storage_path: input.storagePath,
          sort_order: input.sortOrder,
        })
        .select("id, storage_path, sort_order")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "Failed to create restroom photo");
      }
      const row = data as PhotoRow;
      return {
        id: row.id,
        storagePath: row.storage_path,
        sortOrder: row.sort_order,
      };
    },

    async insertVerify(
      _input: InsertVerifyInput,
    ): Promise<InsertVerifyOutcome> {
      notImplemented("insertVerify");
    },

    async upsertReview(
      _input: UpsertReviewPortInput,
    ): Promise<UpsertReviewOutcome> {
      notImplemented("upsertReview");
    },

    async createReviewPhoto(
      _input: CreateReviewPhotoInput,
    ): Promise<StoredPhotoRow> {
      notImplemented("createReviewPhoto");
    },

    async softRemoveReviewPhotos(_reviewId: string): Promise<void> {
      notImplemented("softRemoveReviewPhotos");
    },

    async insertReport(
      _input: InsertReportInput,
    ): Promise<InsertReportOutcome> {
      notImplemented("insertReport");
    },

    async hasOtherUserCommunityActivity(
      _restroomId: string,
      _creatorId: string,
    ): Promise<boolean> {
      notImplemented("hasOtherUserCommunityActivity");
    },

    async updateRestroomFields(
      input: UpdateRestroomFieldsInput,
    ): Promise<UpdateRestroomFieldsOutcome> {
      const supabase = await db();
      const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (input.floorArea !== undefined) patch.floor_area = input.floorArea;
      if (input.restroomLabel !== undefined) {
        patch.restroom_label = input.restroomLabel;
      }
      if (input.bidetType !== undefined) patch.bidet_type = input.bidetType;
      if (input.hasTissue !== undefined) patch.has_tissue = input.hasTissue;
      if (input.hasSoap !== undefined) patch.has_soap = input.hasSoap;
      if (input.hasHandDrying !== undefined) {
        patch.has_hand_drying = input.hasHandDrying;
      }
      if (input.accessCost !== undefined) patch.access_cost = input.accessCost;
      if (input.accessScope !== undefined) {
        patch.access_scope = input.accessScope;
      }
      if (input.establishmentId !== undefined) {
        patch.establishment_id = input.establishmentId;
      }

      let query = supabase.from("restrooms").update(patch).eq("id", input.restroomId);
      if (!input.allowArchived) {
        query = query.neq("status", "archived");
      }

      const { data, error } = await query.select("id").maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      if (!data) return { status: "not_found" };
      return { status: "updated" };
    },

    async softRemoveRestroomPhotos(restroomId: string): Promise<void> {
      const supabase = await db();
      const { error } = await supabase
        .from("restroom_photos")
        .update({ removed_at: new Date().toISOString() })
        .eq("restroom_id", restroomId)
        .is("removed_at", null);
      if (error) {
        throw new Error(error.message);
      }
    },

    async setRestroomStatus(
      input: SetRestroomStatusInput,
    ): Promise<SetRestroomStatusOutcome> {
      const supabase = await db();
      const { data, error } = await supabase
        .from("restrooms")
        .update({
          status: input.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.restroomId)
        .select("id")
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }
      if (!data) return { status: "not_found" };
      return { status: "updated" };
    },

    async softRemovePhoto(
      _input: SoftRemovePhotoInput,
    ): Promise<SoftRemovePhotoOutcome> {
      notImplemented("softRemovePhoto");
    },

    async updateEstablishment(input: UpdateEstablishmentInput): Promise<void> {
      const supabase = await db();
      const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (input.name !== undefined) patch.name = input.name;
      if (input.formattedAddress !== undefined) {
        patch.formatted_address = input.formattedAddress;
      }
      if (input.lat !== undefined) patch.lat = input.lat;
      if (input.lng !== undefined) patch.lng = input.lng;
      if (input.placeId !== undefined) patch.place_id = input.placeId;

      const { error } = await supabase
        .from("establishments")
        .update(patch)
        .eq("id", input.establishmentId);
      if (error) {
        throw new Error(error.message);
      }
    },

    async deleteRestroom(
      _restroomId: string,
    ): Promise<DeleteRestroomOutcome> {
      notImplemented("deleteRestroom");
    },

    async mergeRestrooms(
      _input: MergeRestroomsInput,
    ): Promise<MergeRestroomsOutcome> {
      notImplemented("mergeRestrooms");
    },

    async findOpenReports(): Promise<OpenReportRow[]> {
      const supabase = await db();
      const { data, error } = await supabase
        .from("reports")
        .select(
          "id, restroom_id, reason, details, status, created_at, restrooms ( establishments ( name ) ), profiles!reports_reporter_id_fkey ( display_name )",
        )
        .eq("status", "open")
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      type Joined = {
        id: string;
        restroom_id: string;
        reason: OpenReportRow["reason"];
        details: string | null;
        status: "open";
        created_at: string;
        restrooms:
          | {
              establishments: { name: string } | { name: string }[] | null;
            }
          | {
              establishments: { name: string } | { name: string }[] | null;
            }[]
          | null;
        profiles: { display_name: string } | { display_name: string }[] | null;
      };

      function firstRelation<T>(value: T | T[] | null | undefined): T | null {
        if (value == null) return null;
        return Array.isArray(value) ? (value[0] ?? null) : value;
      }

      return ((data ?? []) as Joined[]).map((row) => {
        const restroom = firstRelation(row.restrooms);
        const establishment = firstRelation(restroom?.establishments ?? null);
        const reporter = firstRelation(row.profiles);
        return {
          id: row.id,
          restroomId: row.restroom_id,
          reason: row.reason,
          details: row.details,
          status: "open" as const,
          createdAt: row.created_at,
          restroomName: establishment?.name ?? "Unknown",
          reporterDisplayName: reporter?.display_name ?? "Unknown",
        };
      });
    },

    async updateReportStatus(
      input: UpdateReportStatusInput,
    ): Promise<UpdateReportStatusOutcome> {
      const supabase = await db();
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("reports")
        .update({
          status: input.status,
          reviewed_by: input.reviewedBy,
          reviewed_at: now,
        })
        .eq("id", input.reportId)
        .eq("status", "open")
        .select("id")
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }
      if (!data) return { status: "not_found" };
      return { status: "updated" };
    },

    async findAdminRestroomSummaries(): Promise<AdminRestroomSummary[]> {
      const supabase = await db();
      const { data, error } = await supabase
        .from("restrooms")
        .select(
          "id, floor_area, restroom_label, bidet_type, has_tissue, has_soap, has_hand_drying, access_cost, access_scope, status, verify_count, updated_at, establishments ( place_id, name, formatted_address, lat, lng )",
        )
        .order("updated_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      type Joined = {
        id: string;
        floor_area: string | null;
        restroom_label: string | null;
        bidet_type: AdminRestroomSummary["bidetType"];
        has_tissue: boolean;
        has_soap: boolean;
        has_hand_drying: boolean;
        access_cost: AdminRestroomSummary["accessCost"];
        access_scope: AdminRestroomSummary["accessScope"];
        status: AdminRestroomSummary["status"];
        verify_count: number;
        establishments:
          | {
              place_id: string;
              name: string;
              formatted_address: string | null;
              lat: number;
              lng: number;
            }
          | {
              place_id: string;
              name: string;
              formatted_address: string | null;
              lat: number;
              lng: number;
            }[]
          | null;
      };

      return ((data ?? []) as Joined[]).flatMap((row) => {
        const est = Array.isArray(row.establishments)
          ? row.establishments[0]
          : row.establishments;
        if (!est) return [];
        return [
          {
            id: row.id,
            name: est.name,
            status: row.status,
            verifyCount: row.verify_count,
            floorArea: row.floor_area,
            restroomLabel: row.restroom_label,
            placeId: est.place_id,
            formattedAddress: est.formatted_address,
            lat: est.lat,
            lng: est.lng,
            bidetType: row.bidet_type,
            hasTissue: row.has_tissue,
            hasSoap: row.has_soap,
            hasHandDrying: row.has_hand_drying,
            accessCost: row.access_cost,
            accessScope: row.access_scope,
          },
        ];
      });
    },
  };
}
