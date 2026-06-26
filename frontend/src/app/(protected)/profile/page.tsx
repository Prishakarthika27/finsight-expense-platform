"use client"

import { useState, useEffect } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useProfile } from "@/hooks/useProfile"
import { getInitials, formatDate } from "@/lib/utils"
import { createClient } from "@/lib/supabase"
import { Camera } from "lucide-react"
import { AvatarPicker } from "@/components/shared/avatar-picker"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

function PasswordChangeForm() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setSuccess(true)
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handlePasswordChange} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNew ? "text" : "password"}
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs"
          >
            {showNew ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs"
          >
            {showConfirm ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-600">Password changed successfully!</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Changing..." : "Change Password"}
      </Button>
    </form>
  )
}
export default function ProfilePage() {
  const { profile, loading, error, updateProfile } = useProfile()
  const [fullName, setFullName] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name)
      setAvatarUrl(profile.avatar_url)
    }
  }, [profile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError("")
    setSaveSuccess(false)
    try {
      await updateProfile({ full_name: fullName })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const uploadAvatarFile = async (file: File) => {
    setUploadingAvatar(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || "Failed to upload avatar")
      }

      const result = await response.json()
      setAvatarUrl(result.avatar_url)
      window.dispatchEvent(new CustomEvent("avatar-updated", { detail: { avatarUrl: result.avatar_url } }))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to upload avatar")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handlePresetAvatar = async (emoji: string, bg: string) => {
    const canvas = document.createElement("canvas")
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = bg
    ctx.beginPath()
    ctx.arc(64, 64, 64, 0, Math.PI * 2)
    ctx.fill()

    ctx.font = "64px serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(emoji, 64, 68)

    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], "preset-avatar.png", { type: "image/png" })
      await uploadAvatarFile(file)
    }, "image/png")
  }

  return (
    <div>
      <Topbar title="Profile" />
      <div className="p-6 max-w-2xl space-y-6">
        {loading && <p className="text-muted-foreground">Loading profile...</p>}
        {error && <p className="text-destructive">Error: {error}</p>}

        {profile && (
          <>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="relative">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="h-16 w-16 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 flex items-center justify-center text-xl font-medium">
                      {getInitials(profile.full_name || "?")}
                    </div>
                  )}
                  <button
                    onClick={() => setPickerOpen(true)}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                </div>
                <div>
                  <p className="text-lg font-semibold">{profile.full_name}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Joined {formatDate(profile.created_at)}
                  </p>
                  {uploadingAvatar && (
                    <p className="text-xs text-primary mt-1">Uploading avatar...</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Edit Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={profile.email || ""} disabled />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  {saveError && <p className="text-sm text-destructive">{saveError}</p>}
                  {saveSuccess && (
                    <p className="text-sm text-emerald-600">Updated successfully!</p>
                  )}
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <PasswordChangeForm />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <AvatarPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelectPreset={handlePresetAvatar}
        onUploadFile={uploadAvatarFile}
        currentAvatarUrl={avatarUrl}
      />
    </div>
  )
}