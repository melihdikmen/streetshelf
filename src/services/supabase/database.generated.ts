
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "blocks": {
                  Row: {
                    "blocked_id": string,"blocker_id": string,"created_at": string
                  }
                  Insert: {
                    "blocked_id": string,"blocker_id": string,"created_at"?: string
                  }
                  Update: {
                    "blocked_id"?: string,"blocker_id"?: string,"created_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "blocks_blocked_id_fkey"
      columns: ["blocked_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "blocks_blocker_id_fkey"
      columns: ["blocker_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"conversation_reads": {
                  Row: {
                    "conversation_id": string,"last_read_at": string,"user_id": string
                  }
                  Insert: {
                    "conversation_id": string,"last_read_at"?: string,"user_id": string
                  }
                  Update: {
                    "conversation_id"?: string,"last_read_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversation_reads_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversation_reads_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"conversations": {
                  Row: {
                    "created_at": string,"id": string,"item_id": string,"last_message_at": string,"owner_id": string,"requester_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"item_id": string,"last_message_at"?: string,"owner_id": string,"requester_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"item_id"?: string,"last_message_at"?: string,"owner_id"?: string,"requester_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversations_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"group_members": {
                  Row: {
                    "group_id": string,"joined_at": string,"role": Database["public"]['Enums']["group_role"],"user_id": string
                  }
                  Insert: {
                    "group_id": string,"joined_at"?: string,"role"?: Database["public"]['Enums']["group_role"],"user_id": string
                  }
                  Update: {
                    "group_id"?: string,"joined_at"?: string,"role"?: Database["public"]['Enums']["group_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "group_members_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "group_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"groups": {
                  Row: {
                    "created_at": string,"created_by": string,"id": string,"invite_code": string,"name": string
                  }
                  Insert: {
                    "created_at"?: string,"created_by": string,"id"?: string,"invite_code": string,"name": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"id"?: string,"invite_code"?: string,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "groups_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"item_groups": {
                  Row: {
                    "group_id": string,"item_id": string
                  }
                  Insert: {
                    "group_id": string,"item_id": string
                  }
                  Update: {
                    "group_id"?: string,"item_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "item_groups_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "item_groups_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    }
                  ]
                },"item_unavailable_dates": {
                  Row: {
                    "day": string,"item_id": string
                  }
                  Insert: {
                    "day": string,"item_id": string
                  }
                  Update: {
                    "day"?: string,"item_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "item_unavailable_dates_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    }
                  ]
                },"items": {
                  Row: {
                    "created_at": string,"currency": string,"description": string,"id": string,"images": (string)[],"is_group_only": boolean,"item_type": Database["public"]['Enums']["item_type"],"location": unknown,"owner_id": string,"price_per_day": number | null,"request_type": Database["public"]['Enums']["request_type"],"status": Database["public"]['Enums']["item_status"],"title": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"currency"?: string,"description"?: string,"id"?: string,"images"?: (string)[],"is_group_only"?: boolean,"item_type": Database["public"]['Enums']["item_type"],"location": unknown,"owner_id": string,"price_per_day"?: number | null,"request_type": Database["public"]['Enums']["request_type"],"status"?: Database["public"]['Enums']["item_status"],"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"currency"?: string,"description"?: string,"id"?: string,"images"?: (string)[],"is_group_only"?: boolean,"item_type"?: Database["public"]['Enums']["item_type"],"location"?: unknown,"owner_id"?: string,"price_per_day"?: number | null,"request_type"?: Database["public"]['Enums']["request_type"],"status"?: Database["public"]['Enums']["item_status"],"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "items_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "body": string | null,"conversation_id": string,"created_at": string,"id": string,"kind": Database["public"]['Enums']["message_kind"],"photo_path": string | null,"sender_id": string | null,"transaction_id": string | null
                  }
                  Insert: {
                    "body"?: string | null,"conversation_id": string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["message_kind"],"photo_path"?: string | null,"sender_id"?: string | null,"transaction_id"?: string | null
                  }
                  Update: {
                    "body"?: string | null,"conversation_id"?: string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["message_kind"],"photo_path"?: string | null,"sender_id"?: string | null,"transaction_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_transaction_id_fkey"
      columns: ["transaction_id"]
isOneToOne: false
      referencedRelation: "transactions"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "area": string | null,"avatar_path": string | null,"created_at": string,"display_name": string,"home_location": unknown,"id": string,"search_radius_m": number,"updated_at": string
                  }
                  Insert: {
                    "area"?: string | null,"avatar_path"?: string | null,"created_at"?: string,"display_name": string,"home_location"?: unknown,"id": string,"search_radius_m"?: number,"updated_at"?: string
                  }
                  Update: {
                    "area"?: string | null,"avatar_path"?: string | null,"created_at"?: string,"display_name"?: string,"home_location"?: unknown,"id"?: string,"search_radius_m"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"id": string,"item_id": string | null,"reason": string,"reporter_id": string,"user_id": string | null
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"item_id"?: string | null,"reason": string,"reporter_id": string,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"item_id"?: string | null,"reason"?: string,"reporter_id"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "comment": string | null,"created_at": string,"from_id": string,"id": string,"rating": number,"tags": (string)[],"to_id": string,"transaction_id": string
                  }
                  Insert: {
                    "comment"?: string | null,"created_at"?: string,"from_id": string,"id"?: string,"rating": number,"tags"?: (string)[],"to_id": string,"transaction_id": string
                  }
                  Update: {
                    "comment"?: string | null,"created_at"?: string,"from_id"?: string,"id"?: string,"rating"?: number,"tags"?: (string)[],"to_id"?: string,"transaction_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_from_id_fkey"
      columns: ["from_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_to_id_fkey"
      columns: ["to_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_transaction_id_fkey"
      columns: ["transaction_id"]
isOneToOne: false
      referencedRelation: "transactions"
      referencedColumns: ["id"]
    }
                  ]
                },"transactions": {
                  Row: {
                    "borrower_id": string,"created_at": string,"currency": string,"delivered_at": string | null,"end_date": string,"id": string,"initiated_by": string,"item_id": string,"owner_id": string,"payment_status": Database["public"]['Enums']["payment_status"],"pickup_photo_path": string | null,"price_per_day_snapshot": number | null,"responded_at": string | null,"return_photo_path": string | null,"returned_at": string | null,"start_date": string,"status": Database["public"]['Enums']["transaction_status"],"total_amount": number,"updated_at": string
                  }
                  Insert: {
                    "borrower_id": string,"created_at"?: string,"currency"?: string,"delivered_at"?: string | null,"end_date": string,"id"?: string,"initiated_by": string,"item_id": string,"owner_id": string,"payment_status"?: Database["public"]['Enums']["payment_status"],"pickup_photo_path"?: string | null,"price_per_day_snapshot"?: number | null,"responded_at"?: string | null,"return_photo_path"?: string | null,"returned_at"?: string | null,"start_date": string,"status"?: Database["public"]['Enums']["transaction_status"],"total_amount"?: number,"updated_at"?: string
                  }
                  Update: {
                    "borrower_id"?: string,"created_at"?: string,"currency"?: string,"delivered_at"?: string | null,"end_date"?: string,"id"?: string,"initiated_by"?: string,"item_id"?: string,"owner_id"?: string,"payment_status"?: Database["public"]['Enums']["payment_status"],"pickup_photo_path"?: string | null,"price_per_day_snapshot"?: number | null,"responded_at"?: string | null,"return_photo_path"?: string | null,"returned_at"?: string | null,"start_date"?: string,"status"?: Database["public"]['Enums']["transaction_status"],"total_amount"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "transactions_borrower_id_fkey"
      columns: ["borrower_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transactions_initiated_by_fkey"
      columns: ["initiated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transactions_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transactions_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "profile_ratings": {
                  Row: {
                    "rating": number | null,"review_count": number | null,"user_id": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_to_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "can_see_via_group":
{ Args: { "p_item_id": string }; Returns: boolean
                           },
"cancel_transaction":
{ Args: { "p_transaction_id": string }; Returns: {
              "borrower_id": string,
"created_at": string,
"currency": string,
"delivered_at": string | null,
"end_date": string,
"id": string,
"initiated_by": string,
"item_id": string,
"owner_id": string,
"payment_status": Database["public"]['Enums']["payment_status"],
"pickup_photo_path": string | null,
"price_per_day_snapshot": number | null,
"responded_at": string | null,
"return_photo_path": string | null,
"returned_at": string | null,
"start_date": string,
"status": Database["public"]['Enums']["transaction_status"],
"total_amount": number,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "transactions"
        isOneToOne: true
        isSetofReturn: false
      } },
"confirm_pickup":
{ Args: { "p_photo_path": string,"p_transaction_id": string }; Returns: {
              "borrower_id": string,
"created_at": string,
"currency": string,
"delivered_at": string | null,
"end_date": string,
"id": string,
"initiated_by": string,
"item_id": string,
"owner_id": string,
"payment_status": Database["public"]['Enums']["payment_status"],
"pickup_photo_path": string | null,
"price_per_day_snapshot": number | null,
"responded_at": string | null,
"return_photo_path": string | null,
"returned_at": string | null,
"start_date": string,
"status": Database["public"]['Enums']["transaction_status"],
"total_amount": number,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "transactions"
        isOneToOne: true
        isSetofReturn: false
      } },
"confirm_return":
{ Args: { "p_photo_path": string,"p_transaction_id": string }; Returns: {
              "borrower_id": string,
"created_at": string,
"currency": string,
"delivered_at": string | null,
"end_date": string,
"id": string,
"initiated_by": string,
"item_id": string,
"owner_id": string,
"payment_status": Database["public"]['Enums']["payment_status"],
"pickup_photo_path": string | null,
"price_per_day_snapshot": number | null,
"responded_at": string | null,
"return_photo_path": string | null,
"returned_at": string | null,
"start_date": string,
"status": Database["public"]['Enums']["transaction_status"],
"total_amount": number,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "transactions"
        isOneToOne: true
        isSetofReturn: false
      } },
"create_group":
{ Args: { "p_name": string }; Returns: {
              "created_at": string,
"created_by": string,
"id": string,
"invite_code": string,
"name": string
            }
                          SetofOptions: {
        from: "*"
        to: "groups"
        isOneToOne: true
        isSetofReturn: false
      } },
"create_item":
{ Args: { "p_description": string,"p_group_ids"?: (string)[],"p_images": (string)[],"p_item_type": Database["public"]['Enums']["item_type"],"p_lat": number,"p_lng": number,"p_price_per_day": number,"p_request_type": Database["public"]['Enums']["request_type"],"p_title": string }; Returns: {
              "created_at": string,
"currency": string,
"description": string,
"id": string,
"images": (string)[],
"is_group_only": boolean,
"item_type": Database["public"]['Enums']["item_type"],
"location": unknown,
"owner_id": string,
"price_per_day": number | null,
"request_type": Database["public"]['Enums']["request_type"],
"status": Database["public"]['Enums']["item_status"],
"title": string,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "items"
        isOneToOne: true
        isSetofReturn: false
      } },
"ensure_conversation":
{ Args: { "p_item_id": string }; Returns: {
              "created_at": string,
"id": string,
"item_id": string,
"last_message_at": string,
"owner_id": string,
"requester_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "conversations"
        isOneToOne: true
        isSetofReturn: false
      } },
"fuzz_point":
{ Args: { "p": unknown }; Returns: {
              "lat": number,"lng": number
            }[]
                           },
"generate_invite_code":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"group_items":
{ Args: { "p_group_id": string,"p_item_types"?: (Database["public"]['Enums']["item_type"])[],"p_lat"?: number,"p_limit"?: number,"p_lng"?: number,"p_offset"?: number,"p_request_type"?: Database["public"]['Enums']["request_type"] }; Returns: {
              "approx_lat": number,"approx_lng": number,"created_at": string,"currency": string,"description": string,"distance_m": number,"group_ids": (string)[],"id": string,"images": (string)[],"is_group_only": boolean,"item_type": Database["public"]['Enums']["item_type"],"owner_id": string,"price_per_day": number,"request_type": Database["public"]['Enums']["request_type"],"reserved_until": string,"status": Database["public"]['Enums']["item_status"],"title": string
            }[]
                           },
"is_blocked_either_way":
{ Args: { "p_other": string }; Returns: boolean
                           },
"is_conversation_party":
{ Args: { "p_conversation_id": string }; Returns: boolean
                           },
"is_group_member":
{ Args: { "p_group_id": string }; Returns: boolean
                           },
"is_item_owner":
{ Args: { "p_item_id": string }; Returns: boolean
                           },
"is_transaction_party":
{ Args: { "p_transaction_id": string }; Returns: boolean
                           },
"item_positions":
{ Args: { "p_item_ids": (string)[],"p_lat"?: number,"p_lng"?: number }; Returns: {
              "approx_lat": number,"approx_lng": number,"distance_m": number,"id": string,"reserved_until": string
            }[]
                           },
"join_group":
{ Args: { "p_code": string }; Returns: {
              "created_at": string,
"created_by": string,
"id": string,
"invite_code": string,
"name": string
            }
                          SetofOptions: {
        from: "*"
        to: "groups"
        isOneToOne: true
        isSetofReturn: false
      } },
"mark_conversation_read":
{ Args: { "p_conversation_id": string }; Returns: undefined
                           },
"my_conversations":
{ Args: Record<PropertyKey, never>; Returns: {
              "id": string,"item_id": string,"last_body": string,"last_kind": Database["public"]['Enums']["message_kind"],"last_message_at": string,"last_sender_id": string,"other_id": string,"unread": number
            }[]
                           },
"my_groups":
{ Args: Record<PropertyKey, never>; Returns: {
              "id": string,"invite_code": string,"member_count": number,"name": string,"role": Database["public"]['Enums']["group_role"]
            }[]
                           },
"nearby_items":
{ Args: { "p_item_types"?: (Database["public"]['Enums']["item_type"])[],"p_lat": number,"p_limit"?: number,"p_lng": number,"p_offset"?: number,"p_radius_m"?: number,"p_request_type"?: Database["public"]['Enums']["request_type"] }; Returns: {
              "approx_lat": number,"approx_lng": number,"created_at": string,"currency": string,"description": string,"distance_m": number,"group_ids": (string)[],"id": string,"images": (string)[],"is_group_only": boolean,"item_type": Database["public"]['Enums']["item_type"],"owner_id": string,"price_per_day": number,"request_type": Database["public"]['Enums']["request_type"],"reserved_until": string,"status": Database["public"]['Enums']["item_status"],"title": string
            }[]
                           },
"profile_summary":
{ Args: { "p_user_id": string }; Returns: {
              "area": string,"avatar_path": string,"borrowed_count": number,"display_name": string,"id": string,"member_since": string,"rating": number,"review_count": number,"shared_count": number
            }[]
                           },
"request_transaction":
{ Args: { "p_end_date": string,"p_item_id": string,"p_message"?: string,"p_start_date": string }; Returns: {
              "borrower_id": string,
"created_at": string,
"currency": string,
"delivered_at": string | null,
"end_date": string,
"id": string,
"initiated_by": string,
"item_id": string,
"owner_id": string,
"payment_status": Database["public"]['Enums']["payment_status"],
"pickup_photo_path": string | null,
"price_per_day_snapshot": number | null,
"responded_at": string | null,
"return_photo_path": string | null,
"returned_at": string | null,
"start_date": string,
"status": Database["public"]['Enums']["transaction_status"],
"total_amount": number,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "transactions"
        isOneToOne: true
        isSetofReturn: false
      } },
"reserved_until":
{ Args: { "p_item_id": string }; Returns: string
                           },
"respond_transaction":
{ Args: { "p_accept": boolean,"p_transaction_id": string }; Returns: {
              "borrower_id": string,
"created_at": string,
"currency": string,
"delivered_at": string | null,
"end_date": string,
"id": string,
"initiated_by": string,
"item_id": string,
"owner_id": string,
"payment_status": Database["public"]['Enums']["payment_status"],
"pickup_photo_path": string | null,
"price_per_day_snapshot": number | null,
"responded_at": string | null,
"return_photo_path": string | null,
"returned_at": string | null,
"start_date": string,
"status": Database["public"]['Enums']["transaction_status"],
"total_amount": number,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "transactions"
        isOneToOne: true
        isSetofReturn: false
      } },
"set_unavailable_dates":
{ Args: { "p_days": (string)[],"p_item_id": string }; Returns: undefined
                           },
"submit_review":
{ Args: { "p_comment"?: string,"p_rating": number,"p_tags"?: (string)[],"p_transaction_id": string }; Returns: {
              "comment": string | null,
"created_at": string,
"from_id": string,
"id": string,
"rating": number,
"tags": (string)[],
"to_id": string,
"transaction_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "reviews"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            "group_role": "ADMIN"|"MEMBER","item_status": "ACTIVE"|"RESERVED"|"COMPLETED"|"ARCHIVED","item_type": "GIFT"|"LEND"|"RENT","message_kind": "TEXT"|"REQUEST"|"PICKUP_PHOTO"|"RETURN_PHOTO"|"SYSTEM","payment_status": "NONE"|"HELD"|"CAPTURED"|"REFUNDED","request_type": "OFFER"|"WANTED","transaction_status": "PENDING"|"ACCEPTED"|"REJECTED"|"DELIVERED"|"RETURNED"|"CANCELLED"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "group_role": ["ADMIN", "MEMBER"],"item_status": ["ACTIVE", "RESERVED", "COMPLETED", "ARCHIVED"],"item_type": ["GIFT", "LEND", "RENT"],"message_kind": ["TEXT", "REQUEST", "PICKUP_PHOTO", "RETURN_PHOTO", "SYSTEM"],"payment_status": ["NONE", "HELD", "CAPTURED", "REFUNDED"],"request_type": ["OFFER", "WANTED"],"transaction_status": ["PENDING", "ACCEPTED", "REJECTED", "DELIVERED", "RETURNED", "CANCELLED"]
          }
        }
} as const

