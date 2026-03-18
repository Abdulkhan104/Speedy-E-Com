// src/components/ImageUploader.tsx
import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  currentUrl: string
  onUpload: (url: string) => void
}

export default function ImageUploader({ currentUrl, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File) {
    // Validate
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (jpg, png, webp)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }

    setError('')
    setUploading(true)

    // Unique filename: timestamp + original name
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    // Get the public URL
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filename)

    onUpload(data.publicUrl)
    setUploading(false)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  async function removeImage() {
    if (!currentUrl) return
    // Extract filename from URL
    const parts = currentUrl.split('/product-images/')
    if (parts.length === 2) {
      await supabase.storage
        .from('product-images')
        .remove([parts[1]])
    }
    onUpload('')
  }

  return (
    <div className="image-uploader">
      {currentUrl ? (
        // Preview with remove button
        <div className="uploader-preview">
          <img src={currentUrl} alt="Product" className="uploader-img" />
          <div className="uploader-preview-actions">
            <button
              type="button"
              className="uploader-change-btn"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              Change image
            </button>
            <button
              type="button"
              className="uploader-remove-btn"
              onClick={removeImage}
              disabled={uploading}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        // Drop zone
        <div
          className={`uploader-dropzone${dragging ? ' dragging' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {uploading ? (
            <p className="uploader-hint">Uploading...</p>
          ) : (
            <>
              <div className="uploader-icon">↑</div>
              <p className="uploader-label">Click or drag image here</p>
              <p className="uploader-hint">JPG, PNG, WebP — max 5MB</p>
            </>
          )}
        </div>
      )}

      {error && <p className="uploader-error">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onInputChange}
      />
    </div>
  )
}