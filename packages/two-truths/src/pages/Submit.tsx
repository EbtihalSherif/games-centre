import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { compress, Link, palette } from '@games/core'
import { addSubmission, uploadImage } from '../lib/store'
import type { Href } from '../Game'
import type { BonusPhoto } from '../types'

const MAX_BONUS = 4
const MAX_LEN = 200

type PhotoDraft = { blob: Blob; preview: string }
type BonusDraft = { id: string; blob: Blob; preview: string; caption: string; link: string }

export default function Submit({ href, roundId }: { href: Href; roundId: string }) {
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState<PhotoDraft | null>(null)
  const [texts, setTexts] = useState(['', '', ''])
  const [lie, setLie] = useState<number | null>(null)
  const [bonus, setBonus] = useState<BonusDraft[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const errRef = useRef<HTMLDivElement>(null)

  const fail = (msg: string) => {
    setError(msg)
    setTimeout(() => errRef.current?.focus(), 0)
  }

  async function pickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const blob = await compress(f)
      setPhoto({ blob, preview: URL.createObjectURL(blob) })
      setError('')
    } catch {
      fail("We couldn't read that image. Try a JPG or PNG.")
    }
  }

  async function pickBonus(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files || [])].slice(0, MAX_BONUS - bonus.length)
    e.target.value = ''
    const added: BonusDraft[] = []
    for (const f of files) {
      try {
        const blob = await compress(f)
        added.push({ id: crypto.randomUUID(), blob, preview: URL.createObjectURL(blob), caption: '', link: '' })
      } catch {
        fail(`We couldn't read "${f.name}". Try a JPG or PNG.`)
      }
    }
    if (added.length) setBonus((b) => [...b, ...added])
  }

  const updateBonus = (id: string, patch: Partial<BonusDraft>) =>
    setBonus((b) => b.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const removeBonus = (id: string) => setBonus((b) => b.filter((x) => x.id !== id))

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const problems: string[] = []
    if (!name.trim()) problems.push('Add your name.')
    if (!photo) problems.push('Add a photo of yourself.')
    if (texts.some((t) => !t.trim())) problems.push('Fill in all three statements.')
    if (lie === null) problems.push('Mark which statement is the lie.')
    if (problems.length || !photo) return fail(problems.join(' '))

    setError('')
    setBusy(true)
    try {
      const photo_url = await uploadImage(photo.blob)
      const bonusOut: BonusPhoto[] = []
      for (const b of bonus) {
        bonusOut.push({
          url: await uploadImage(b.blob),
          caption: b.caption.trim(),
          statement: b.link === '' ? null : Number(b.link),
        })
      }
      await addSubmission({
        round_id: roundId,
        name: name.trim(),
        photo_url,
        statements: texts.map((t, i) => ({ text: t.trim(), truth: i !== lie })),
        bonus: bonusOut,
      })
      setDone(true)
      window.scrollTo(0, 0)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error'
      fail(`Something went wrong while saving. Please try again. (${message})`)
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setName('')
    setPhoto(null)
    setTexts(['', '', ''])
    setLie(null)
    setBonus([])
    setDone(false)
  }

  if (done)
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '3.5rem' }} aria-hidden>🎉</Typography>
        <Typography variant="h1" gutterBottom>You're in!</Typography>
        <Typography color="text.secondary">
          Thanks, {name.trim()}. Your statements are saved and hidden until the host reveals them.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 3 }}>
          <Button variant="outlined" onClick={reset}>Add another player</Button>
          <Button component={Link} to={href(`/round/${roundId}`)}>Back to the round</Button>
        </Stack>
      </Paper>
    )

  return (
    <Paper
      component="form"
      onSubmit={submit}
      noValidate
      aria-labelledby="form-h"
      sx={{ overflow: 'hidden', width: '100%', maxWidth: 760, mx: 'auto' }}
    >
      <Box sx={{ height: 10, backgroundImage: `linear-gradient(90deg, ${palette.mint}, ${palette.sky}, ${palette.violet})` }} />
      <Stack spacing={3} sx={{ p: { xs: 3, sm: 4 } }}>
        <Box>
          <Button component={Link} to={href(`/round/${roundId}`)} variant="text" size="small" sx={{ ml: -1.5, mb: 1 }}>
            ← Back to the round
          </Button>
          <Typography id="form-h" variant="h1">Add your two truths and a lie</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Write three things about yourself. Two must be true, one must be a lie. Make it hard to guess!
          </Typography>
        </Box>

        <Box ref={errRef} tabIndex={-1} role="alert" sx={{ outline: 'none' }}>
          {error && <Alert severity="error">{error}</Alert>}
        </Box>

        <TextField
          id="name"
          label="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
          slotProps={{ htmlInput: { maxLength: 60 } }}
        />

        <Stack direction="row" spacing={2} alignItems="center">
          <Button component="label" variant="outlined">
            {photo ? 'Change photo' : 'Add your photo'}
            <input id="photo" hidden type="file" accept="image/*" onChange={pickPhoto} />
          </Button>
          {photo && <Avatar src={photo.preview} alt="Preview of your photo" sx={{ width: 72, height: 72 }} />}
        </Stack>

        <FormControl component="fieldset">
          <FormLabel component="legend" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            Your three statements
          </FormLabel>
          <RadioGroup value={lie ?? ''} onChange={(e) => setLie(Number(e.target.value))}>
            <Stack spacing={2}>
              {texts.map((t, i) => (
                <Box key={i} sx={{ bgcolor: '#F6F1FF', borderRadius: '18px', p: 2 }}>
                  <TextField
                    id={`s${i}`}
                    label={`Statement ${i + 1}`}
                    multiline
                    minRows={2}
                    value={t}
                    onChange={(e) => setTexts((x) => x.map((v, j) => (j === i ? e.target.value : v)))}
                    required
                    slotProps={{ htmlInput: { maxLength: MAX_LEN } }}
                  />
                  <FormControlLabel
                    value={i}
                    control={<Radio name="lie" />}
                    label={`Statement ${i + 1} is my lie`}
                    sx={{ mt: 1 }}
                  />
                </Box>
              ))}
            </Stack>
          </RadioGroup>
        </FormControl>

        <FormControl component="fieldset">
          <FormLabel component="legend" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Bonus photos <Typography component="span" color="text.secondary">(optional, up to {MAX_BONUS})</Typography>
          </FormLabel>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5, mb: 1.5 }}>
            Photos that "prove" a statement (true or not!) or are just fun extras. They stay hidden until the lie is revealed.
          </Typography>
          {bonus.length < MAX_BONUS && (
            <Button component="label" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
              Add bonus photos
              <input id="bonus" hidden type="file" accept="image/*" multiple onChange={pickBonus} />
            </Button>
          )}
          <Stack spacing={2} sx={{ mt: 2 }} component="ul" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {bonus.map((b, i) => (
              <Stack
                key={b.id}
                component="li"
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ bgcolor: '#F6F1FF', borderRadius: '18px', p: 2 }}
              >
                <Box
                  component="img"
                  src={b.preview}
                  alt={`Bonus photo ${i + 1} preview`}
                  sx={{ width: 110, height: 110, objectFit: 'contain', borderRadius: '10px', bgcolor: '#fff' }}
                />
                <Stack spacing={1.5} flex={1}>
                  <TextField
                    id={`cap${b.id}`}
                    label="Caption (optional)"
                    size="small"
                    value={b.caption}
                    onChange={(e) => updateBonus(b.id, { caption: e.target.value })}
                    slotProps={{ htmlInput: { maxLength: 80 } }}
                  />
                  <FormControl size="small" fullWidth>
                    <InputLabel id={`lnk-l${b.id}`}>Goes with</InputLabel>
                    <Select
                      labelId={`lnk-l${b.id}`}
                      id={`lnk${b.id}`}
                      label="Goes with"
                      value={b.link}
                      onChange={(e) => updateBonus(b.id, { link: String(e.target.value) })}
                    >
                      <MenuItem value="">Just a bonus</MenuItem>
                      <MenuItem value="0">Statement 1</MenuItem>
                      <MenuItem value="1">Statement 2</MenuItem>
                      <MenuItem value="2">Statement 3</MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton
                    onClick={() => removeBonus(b.id)}
                    color="error"
                    sx={{ alignSelf: 'flex-start' }}
                    aria-label={`Remove bonus photo ${i + 1}`}
                  >
                    🗑️
                  </IconButton>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </FormControl>

        <Button type="submit" size="large" disabled={busy} aria-busy={busy}>
          {busy ? 'Saving…' : 'Submit'}
        </Button>
      </Stack>
    </Paper>
  )
}
