import { useQuery } from '@tanstack/react-query'
import { supabase, unwrap } from '../../lib/supabase'
import type { Json } from '../../lib/database.types'
import { createCatalog, type Catalog, type Requirement, type TextSection } from '../../game/catalog'
import type { ResourceKey } from '../../game/data/classes'

export const catalogKeys = {
  all: ['catalog'] as const,
}

// I cataloghi si scrivono solo con le migrazioni: il JSON ha la forma attesa.
const asSections = (value: Json) => value as unknown as TextSection[]
const asRequirements = (value: Json) => value as unknown as Requirement[]

async function fetchCatalog(): Promise<Catalog> {
  const [raceFamilies, races, classes, elements, deities, alignments, skills, weapons, armors] = await Promise.all([
    supabase.from('race_families').select('key, name, intro').order('sort_order'),
    supabase
      .from('races')
      .select('key, name, family_key, hp_coefficient, appearance, size_lifespan, typical_alignment, society, traits')
      .order('sort_order'),
    supabase
      .from('classes')
      .select(
        'key, name, kind, motto, summary, sections, resource_key, power_kind, power_label, power_singular, power_attribute, requires_deity, requires_element',
      )
      .order('sort_order'),
    supabase.from('elements').select('key, name, nature, spell_examples, creatures, opposite_key, deity_key').order('sort_order'),
    supabase
      .from('deities')
      .select('key, name, motto, domain, lore, divine_weapon, outsiders, miracle_examples')
      .order('sort_order'),
    supabase.from('alignments').select('key, code, name, archetype, description, example').order('sort_order'),
    supabase.from('skills').select('key, name, attribute, max_level, description, requirements').order('sort_order'),
    supabase.from('weapons').select('key, name, category, skill_key, requirement, note').order('sort_order'),
    supabase.from('armors').select('key, name, armor_type, description, requirement, note').order('sort_order'),
  ])

  return createCatalog({
    raceFamilies: unwrap(raceFamilies),
    races: unwrap(races).map((r) => ({
      key: r.key,
      name: r.name,
      familyKey: r.family_key,
      hpCoefficient: r.hp_coefficient,
      appearance: r.appearance,
      sizeLifespan: r.size_lifespan,
      typicalAlignment: r.typical_alignment,
      society: r.society,
      traits: r.traits,
    })),
    classes: unwrap(classes).map((c) => ({
      key: c.key,
      name: c.name,
      kind: c.kind,
      motto: c.motto,
      summary: c.summary,
      sections: asSections(c.sections),
      resourceKey: c.resource_key as ResourceKey | null,
      powers:
        c.power_kind && c.power_label && c.power_singular && c.power_attribute
          ? { kind: c.power_kind, label: c.power_label, singular: c.power_singular, attribute: c.power_attribute }
          : null,
      requiresDeity: c.requires_deity,
      requiresElement: c.requires_element,
    })),
    elements: unwrap(elements).map((e) => ({
      key: e.key,
      name: e.name,
      nature: e.nature,
      spellExamples: e.spell_examples,
      creatures: e.creatures,
      oppositeKey: e.opposite_key,
      deityKey: e.deity_key,
    })),
    deities: unwrap(deities).map((d) => ({
      key: d.key,
      name: d.name,
      motto: d.motto,
      domain: d.domain,
      lore: d.lore,
      divineWeapon: d.divine_weapon,
      outsiders: d.outsiders,
      miracleExamples: d.miracle_examples,
    })),
    alignments: unwrap(alignments),
    skills: unwrap(skills).map((s) => ({
      key: s.key,
      name: s.name,
      attribute: s.attribute,
      maxLevel: s.max_level,
      description: s.description,
      requirements: asRequirements(s.requirements),
    })),
    weapons: unwrap(weapons).map((w) => ({
      key: w.key,
      name: w.name,
      category: w.category,
      skillKey: w.skill_key,
      requirement: w.requirement,
      note: w.note,
    })),
    armors: unwrap(armors).map((a) => ({
      key: a.key,
      name: a.name,
      armorType: a.armor_type,
      description: a.description,
      requirement: a.requirement,
      note: a.note,
    })),
  })
}

/** Tutti i cataloghi, scaricati una volta: non cambiano durante il gioco. */
export function useCatalogQuery() {
  return useQuery({
    queryKey: catalogKeys.all,
    queryFn: fetchCatalog,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
