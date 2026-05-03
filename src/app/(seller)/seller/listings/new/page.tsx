"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { GRADING_COMPANIES, RAW_CONDITIONS, POKEMON_SETS, PSA_GRADES } from "@/lib/constants"
import { Upload, X } from "lucide-react"

const schema = z.object({
  title:           z.string().min(5, "Title must be at least 5 characters"),
  card_name:       z.string().min(1, "Card name is required"),
  set_name:        z.string().optional(),
  card_number:     z.string().optional(),
  condition:       z.enum(["Graded", "Raw"]),
  grading_company: z.string().optional(),
  grade:           z.string().optional(),
  raw_condition:   z.string().optional(),
  price:           z.number().positive("Price must be greater than 0"),
  description:     z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewListingPage() {
  const router = useRouter()
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const { register, handleSubmit, watch, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { condition: "Raw" },
  })

  const condition = watch("condition")

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 6 - imageFiles.length)
    setImageFiles((prev) => [...prev, ...files])
    files.forEach((f) => {
      const reader = new FileReader()
      reader.onload = (ev) => setImagePreviews((p) => [...p, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  function removeImage(i: number) {
    setImageFiles((f) => f.filter((_, idx) => idx !== i))
    setImagePreviews((p) => p.filter((_, idx) => idx !== i))
  }

  async function onSubmit(data: FormData) {
    setError("")
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login?redirect=/seller/listings/new"); return }

    const { data: seller } = await supabase.from("sellers").select("id").eq("id", user.id).single()
    if (!seller) { router.push("/seller/onboarding"); return }

    // Upload images
    setUploading(true)
    const imageUrls: string[] = []
    for (const file of imageFiles) {
      const ext = file.name.split(".").pop()
      const path = `listings/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from("listing-images").upload(path, file)
      if (uploadError) { setError(`Image upload failed: ${uploadError.message}`); setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from("listing-images").getPublicUrl(path)
      imageUrls.push(publicUrl)
    }
    setUploading(false)

    const { error: insertError } = await supabase.from("listings").insert({
      seller_id: user.id,
      title: data.title,
      card_name: data.card_name,
      set_name: data.set_name,
      card_number: data.card_number,
      condition: data.condition,
      grading_company: data.condition === "Graded" ? data.grading_company : null,
      grade: data.condition === "Graded" ? data.grade : null,
      raw_condition: data.condition === "Raw" ? data.raw_condition : null,
      price: data.price,
      description: data.description,
      images: imageUrls,
    })

    if (insertError) { setError(insertError.message); return }
    router.push("/seller/dashboard")
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6">Create Listing</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Card info */}
        <div className="bg-white rounded border border-border p-6 space-y-4">
          <h2 className="font-semibold text-text">Card Information</h2>
          <Input label="Listing Title *" {...register("title")} error={errors.title?.message} placeholder="e.g. Charizard Base Set Holo PSA 10" />
          <Input label="Pokémon / Card Name *" {...register("card_name")} error={errors.card_name?.message} placeholder="Charizard" />
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="set_name"
              control={control}
              render={({ field }) => (
                <Select
                  label="Set"
                  {...field}
                  value={field.value ?? ""}
                  options={POKEMON_SETS.map((s) => ({ label: s, value: s }))}
                  placeholder="Select set..."
                />
              )}
            />
            <Input label="Card Number" {...register("card_number")} placeholder="4/102" />
          </div>
        </div>

        {/* Condition */}
        <div className="bg-white rounded border border-border p-6 space-y-4">
          <h2 className="font-semibold text-text">Condition</h2>
          <Controller
            name="condition"
            control={control}
            render={({ field }) => (
              <Select
                label="Condition Type *"
                {...field}
                options={[{ label: "Graded", value: "Graded" }, { label: "Raw (Ungraded)", value: "Raw" }]}
              />
            )}
          />
          {condition === "Graded" ? (
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="grading_company"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Grading Company *"
                    {...field}
                    value={field.value ?? ""}
                    options={GRADING_COMPANIES.map((g) => ({ label: g, value: g }))}
                    placeholder="Select..."
                  />
                )}
              />
              <Controller
                name="grade"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Grade *"
                    {...field}
                    value={field.value ?? ""}
                    options={PSA_GRADES.map((g) => ({ label: g, value: g }))}
                    placeholder="Select grade..."
                  />
                )}
              />
            </div>
          ) : (
            <Controller
              name="raw_condition"
              control={control}
              render={({ field }) => (
                <Select
                  label="Raw Condition *"
                  {...field}
                  value={field.value ?? ""}
                  options={RAW_CONDITIONS.map((c) => ({ label: c, value: c }))}
                  placeholder="Select condition..."
                />
              )}
            />
          )}
        </div>

        {/* Price */}
        <div className="bg-white rounded border border-border p-6 space-y-4">
          <h2 className="font-semibold text-text">Pricing</h2>
          <Input
            label="Price (USD) *"
            type="number"
            step="0.01"
            min="0.01"
            {...register("price", { valueAsNumber: true })}
            error={errors.price?.message}
            placeholder="0.00"
          />
          <p className="text-xs text-text-secondary">Platform fee: 10% · You receive ~90% of the sale price</p>
        </div>

        {/* Images */}
        <div className="bg-white rounded border border-border p-6 space-y-4">
          <h2 className="font-semibold text-text">Images</h2>
          <div className="flex flex-wrap gap-3">
            {imagePreviews.map((src, i) => (
              <div key={i} className="relative w-20 h-24 rounded border border-border overflow-hidden bg-surface">
                <img src={src} alt="" className="w-full h-full object-contain p-1" />
                <button type="button" onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white border border-border flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {imageFiles.length < 6 && (
              <label className="w-20 h-24 rounded border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center cursor-pointer text-text-muted hover:text-primary transition-colors">
                <Upload className="w-5 h-5" />
                <span className="text-xs mt-1">Add</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>
          <p className="text-xs text-text-secondary">Up to 6 images · JPG, PNG, WebP</p>
        </div>

        {/* Description */}
        <div className="bg-white rounded border border-border p-6">
          <h2 className="font-semibold text-text mb-3">Description</h2>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="Describe the card's condition, any notable details, centering, etc."
            className="w-full rounded border border-border px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" loading={isSubmitting || uploading} className="flex-1">
            {uploading ? "Uploading images..." : "Publish Listing"}
          </Button>
        </div>
      </form>
    </div>
  )
}
