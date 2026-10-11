export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      avisos: {
        Row: {
          atualizado_em: string
          criado_em: string
          exibir_ate: string
          exibir_de: string
          id: string
          imagem_path: string | null
          ordem: number
          paroquia_id: string
          texto: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          exibir_ate: string
          exibir_de: string
          id?: string
          imagem_path?: string | null
          ordem?: number
          paroquia_id: string
          texto?: string
          titulo: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          exibir_ate?: string
          exibir_de?: string
          id?: string
          imagem_path?: string | null
          ordem?: number
          paroquia_id?: string
          texto?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_paroquia_id_fkey"
            columns: ["paroquia_id"]
            isOneToOne: false
            referencedRelation: "paroquias"
            referencedColumns: ["id"]
          },
        ]
      }
      celebracoes: {
        Row: {
          atualizado_em: string
          criado_em: string
          criado_por: string | null
          data: string
          estado: Json
          horario: string
          id: string
          paroquia_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          data: string
          estado?: Json
          horario: string
          id?: string
          paroquia_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          data?: string
          estado?: Json
          horario?: string
          id?: string
          paroquia_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "celebracoes_paroquia_id_fkey"
            columns: ["paroquia_id"]
            isOneToOne: false
            referencedRelation: "paroquias"
            referencedColumns: ["id"]
          },
        ]
      }
      imagens_evangelho: {
        Row: {
          criado_em: string
          id: string
          ordem: number
          paroquia_id: string
          referencia: string
          storage_path: string
        }
        Insert: {
          criado_em?: string
          id?: string
          ordem?: number
          paroquia_id: string
          referencia: string
          storage_path: string
        }
        Update: {
          criado_em?: string
          id?: string
          ordem?: number
          paroquia_id?: string
          referencia?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "imagens_evangelho_paroquia_id_fkey"
            columns: ["paroquia_id"]
            isOneToOne: false
            referencedRelation: "paroquias"
            referencedColumns: ["id"]
          },
        ]
      }
      liturgia_dia: {
        Row: {
          atualizado_em: string
          cor: string
          dados: Json
          data: string
          dia_liturgico: string
          fonte: string | null
        }
        Insert: {
          atualizado_em?: string
          cor: string
          dados: Json
          data: string
          dia_liturgico: string
          fonte?: string | null
        }
        Update: {
          atualizado_em?: string
          cor?: string
          dados?: Json
          data?: string
          dia_liturgico?: string
          fonte?: string | null
        }
        Relationships: []
      }
      membros: {
        Row: {
          criado_em: string
          papel: Database["public"]["Enums"]["papel_membro"]
          paroquia_id: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          papel?: Database["public"]["Enums"]["papel_membro"]
          paroquia_id: string
          user_id: string
        }
        Update: {
          criado_em?: string
          papel?: Database["public"]["Enums"]["papel_membro"]
          paroquia_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membros_paroquia_id_fkey"
            columns: ["paroquia_id"]
            isOneToOne: false
            referencedRelation: "paroquias"
            referencedColumns: ["id"]
          },
        ]
      }
      musicas: {
        Row: {
          artista: string | null
          assinatura: string
          atualizado_em: string
          blocos: Json
          criado_em: string
          criado_por: string | null
          id: string
          letra_original: string | null
          momentos: Database["public"]["Enums"]["momento_missa"][]
          ordem: Json
          paroquia_id: string
          titulo: string
          tom: string | null
        }
        Insert: {
          artista?: string | null
          assinatura: string
          atualizado_em?: string
          blocos?: Json
          criado_em?: string
          criado_por?: string | null
          id?: string
          letra_original?: string | null
          momentos?: Database["public"]["Enums"]["momento_missa"][]
          ordem?: Json
          paroquia_id: string
          titulo: string
          tom?: string | null
        }
        Update: {
          artista?: string | null
          assinatura?: string
          atualizado_em?: string
          blocos?: Json
          criado_em?: string
          criado_por?: string | null
          id?: string
          letra_original?: string | null
          momentos?: Database["public"]["Enums"]["momento_missa"][]
          ordem?: Json
          paroquia_id?: string
          titulo?: string
          tom?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "musicas_paroquia_id_fkey"
            columns: ["paroquia_id"]
            isOneToOne: false
            referencedRelation: "paroquias"
            referencedColumns: ["id"]
          },
        ]
      }
      paroquias: {
        Row: {
          cidade: string | null
          config: Json
          criado_em: string
          id: string
          nome: string
          uf: string | null
        }
        Insert: {
          cidade?: string | null
          config?: Json
          criado_em?: string
          id?: string
          nome: string
          uf?: string | null
        }
        Update: {
          cidade?: string | null
          config?: Json
          criado_em?: string
          id?: string
          nome?: string
          uf?: string | null
        }
        Relationships: []
      }
      planejamento_dia: {
        Row: {
          aclamacao: string | null
          atualizado_em: string
          creio: string | null
          data: string
          gloria: boolean | null
          misterio_fe: number | null
          observacoes: string | null
          oracao_eucaristica: string | null
          paroquia_id: string
          resposta_preces: string | null
        }
        Insert: {
          aclamacao?: string | null
          atualizado_em?: string
          creio?: string | null
          data: string
          gloria?: boolean | null
          misterio_fe?: number | null
          observacoes?: string | null
          oracao_eucaristica?: string | null
          paroquia_id: string
          resposta_preces?: string | null
        }
        Update: {
          aclamacao?: string | null
          atualizado_em?: string
          creio?: string | null
          data?: string
          gloria?: boolean | null
          misterio_fe?: number | null
          observacoes?: string | null
          oracao_eucaristica?: string | null
          paroquia_id?: string
          resposta_preces?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planejamento_dia_paroquia_id_fkey"
            columns: ["paroquia_id"]
            isOneToOne: false
            referencedRelation: "paroquias"
            referencedColumns: ["id"]
          },
        ]
      }
      prestacao_contas: {
        Row: {
          atualizado_em: string
          dados: Json
          exibir_ate: string
          exibir_de: string
          mes: string
          paroquia_id: string
          texto_original: string | null
        }
        Insert: {
          atualizado_em?: string
          dados: Json
          exibir_ate: string
          exibir_de: string
          mes: string
          paroquia_id: string
          texto_original?: string | null
        }
        Update: {
          atualizado_em?: string
          dados?: Json
          exibir_ate?: string
          exibir_de?: string
          mes?: string
          paroquia_id?: string
          texto_original?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prestacao_contas_paroquia_id_fkey"
            columns: ["paroquia_id"]
            isOneToOne: false
            referencedRelation: "paroquias"
            referencedColumns: ["id"]
          },
        ]
      }
      textos: {
        Row: {
          atualizado_em: string
          chave: string
          conteudo: Json
          paroquia_id: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          chave: string
          conteudo?: Json
          paroquia_id: string
          titulo: string
        }
        Update: {
          atualizado_em?: string
          chave?: string
          conteudo?: Json
          paroquia_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "textos_paroquia_id_fkey"
            columns: ["paroquia_id"]
            isOneToOne: false
            referencedRelation: "paroquias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      criar_paroquia: {
        Args: { cidade?: string; nome: string; uf?: string }
        Returns: string
      }
      disparar_sincronizacao_liturgia: {
        Args: { dias: number }
        Returns: number
      }
    }
    Enums: {
      momento_missa:
        | "entrada"
        | "ato-penitencial"
        | "gloria"
        | "salmo"
        | "aclamacao"
        | "ofertorio"
        | "santo"
        | "cordeiro"
        | "comunhao"
        | "acao-de-gracas"
        | "final"
        | "nossa-senhora"
        | "outro"
      papel_membro: "admin" | "editor" | "leitor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      momento_missa: [
        "entrada",
        "ato-penitencial",
        "gloria",
        "salmo",
        "aclamacao",
        "ofertorio",
        "santo",
        "cordeiro",
        "comunhao",
        "acao-de-gracas",
        "final",
        "nossa-senhora",
        "outro",
      ],
      papel_membro: ["admin", "editor", "leitor"],
    },
  },
} as const
