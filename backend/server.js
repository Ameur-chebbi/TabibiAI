import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');

const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  console.warn(`Could not load ${envPath}:`, envResult.error.message);
}

const app = express();
const port = process.env.PORT || 3001;

/**
 * Normalise a raw string for intent matching:
 * lower-case + strip all French diacritics so é/è/ê → e, etc.
 *
 * @param {string} raw
 * @returns {string}
 */
function normalise(raw) {
  return (raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Returns true when ANY of the supplied word-stem patterns match the text.
 * Every pattern is tested as a whole-word boundary match (\b…) so that
 * "annuler" does NOT fire inside a prompt that contains the word in an
 * example sentence like "Patient: I want to annuler…".
 *
 * @param {string} text   - Already-normalised input.
 * @param {RegExp[]} patterns
 * @returns {boolean}
 */
function anyMatch(text, patterns) {
  return patterns.some((re) => re.test(text));
}

// ── Intent pattern sets (word-boundary anchored) ─────────────────────────────

const CANCEL_PATTERNS = [
  /\bannul/,       // annuler, annulation, annule
  /\bsupprim/,     // supprimer, supprime
  /\bcancel/,      // cancel (English)
];

const MODIFY_PATTERNS = [
  /\bmodifi/,      // modifier, modifie, modification
  /\bchang/,       // changer, changement
  /\bdeplacer\b/,  // déplacer
  /\breporter\b/,  // reporter
];

const BOOK_PATTERNS = [
  /\brendez[- ]?vous\b/, // rendez-vous, rendez vous
  /\brdv\b/,             // rdv
  /\bappointment\b/,     // English
  /\breserv/,            // réserver, réservation
  /\bprendre\b/,         // prendre (un rdv)
  /\bfixer\b/,           // fixer (un rdv)
  /\bconsultation\b/,    // consultation
];

const SYMPTOM_PATTERNS = [
  /\bdouleur\b/,   // douleur
  /\bmal\b/,       // mal (j'ai mal)
  /\bsymptom/,     // symptôme, symptom
  /\bfievre\b/,    // fièvre → fievre after normalise
  /\btoux\b/,      // toux
  /\bfatigue\b/,   // fatigue
  /\burgent/,      // urgent, urgence
  /\bbless/,       // blessure, blessé
  /\bdouloure/,    // douloureuse, douloureux
];

const HOURS_PATTERNS = [
  /\bhoraire/,     // horaire, horaires
  /\bouvert/,      // ouvert, ouverture
  /\bferm/,        // ferme, fermeture
  /\bdisponib/,    // disponible, disponibilité
  /\bopening\b/,   // English
  /\bhours\b/,     // English
];

const PRICE_PATTERNS = [
  /\btarif/,       // tarif, tarification
  /\bprix\b/,      // prix
  /\bcout\b/,      // coût → cout after normalise
  /\bcombien\b/,   // combien
  /\bhonoraire/,   // honoraire, honoraires
  /\bprice\b/,     // English
  /\bcost\b/,      // English
];

const LOCATION_PATTERNS = [
  /\badresse\b/,   // adresse
  /\blocalisation\b/,
  /\bcabinet\b/,   // cabinet
  /\bclinique\b/,  // clinique
  /\bsitue\b/,     // situé → situe after normalise
  /\blocation\b/,  // English
  /\baddress\b/,   // English
  /\bou\s+(se\s+trouve|etes[- ]?vous|est\s+le)\b/,
];

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rule-based intelligent assistant for a medical clinic receptionist.
 * Detects the intent of the patient's message and returns an appropriate
 * professional, polite French reply — no external API required.
 *
 * Priority order (highest → lowest):
 *   1. Cancellation
 *   2. Modification
 *   3. Booking
 *   4. Symptoms / pain
 *   5. Working hours
 *   6. Prices
 *   7. Location
 *   8. Fallback
 *
 * @param {string} message - The raw patient message text (NOT a prompt template).
 * @returns {string}
 */
function generateStaticSuggestion(message) {
  const text = normalise(message);

  // 1. Cancellation ─────────────────────────────────────────────────────────
  if (anyMatch(text, CANCEL_PATTERNS)) {
    return "Bonjour, nous pouvons vous aider à annuler votre rendez-vous. Pouvez-vous confirmer la date du rendez-vous concerné ?";
  }

  // 2. Modification ─────────────────────────────────────────────────────────
  if (anyMatch(text, MODIFY_PATTERNS)) {
    return "Bonjour, nous pouvons modifier votre rendez-vous. Pouvez-vous nous indiquer la date actuelle du rendez-vous ainsi que la nouvelle date souhaitée ?";
  }

  // 3. Booking ──────────────────────────────────────────────────────────────
  if (anyMatch(text, BOOK_PATTERNS)) {
    return "Bonjour, merci pour votre message. Nous pouvons organiser votre rendez-vous. Pouvez-vous nous préciser la date et l'heure qui vous conviennent ?";
  }

  // 4. Symptoms / pain ──────────────────────────────────────────────────────
  if (anyMatch(text, SYMPTOM_PATTERNS)) {
    return "Bonjour, merci pour votre message. Pouvez-vous nous préciser vos symptômes et depuis quand vous ressentez cette douleur afin que nous puissions mieux vous orienter ?";
  }

  // 5. Working hours ────────────────────────────────────────────────────────
  if (anyMatch(text, HOURS_PATTERNS)) {
    return "Bonjour, merci pour votre message. Nos horaires d'ouverture sont disponibles auprès du cabinet. Nous pouvons vous aider à choisir un créneau adapté.";
  }

  // 6. Prices ───────────────────────────────────────────────────────────────
  if (anyMatch(text, PRICE_PATTERNS)) {
    return "Bonjour, merci pour votre message. Le tarif de consultation dépend de la spécialité demandée. Pouvez-vous nous préciser la spécialité souhaitée ?";
  }

  // 7. Location ─────────────────────────────────────────────────────────────
  if (anyMatch(text, LOCATION_PATTERNS)) {
    return "Bonjour, merci pour votre message. Notre cabinet est situé à l'adresse indiquée dans nos informations. Nous restons à votre disposition pour toute précision.";
  }

  // 8. Fallback ─────────────────────────────────────────────────────────────
  return "Bonjour, merci pour votre message. Nous avons bien reçu votre demande. Pouvez-vous nous donner plus de détails afin de mieux vous aider ?";
}

/**
 * Extracts the actual patient message from the request payload.
 *
 * The frontend sends a long `prompt` template string that embeds example
 * sentences containing words like "annuler" or "changer" — scanning that
 * string directly produces wrong intent matches.  We therefore prefer the
 * `conversationHistory` array, which contains the raw patient messages, and
 * fall back to `prompt` only when no history is available (e.g. direct API
 * calls / tests).
 *
 * @param {string|undefined} prompt
 * @param {Array}            conversationHistory
 * @returns {string}
 */
function extractPatientMessage(prompt, conversationHistory) {
  // Prefer the last patient message from the structured history — this is
  // always the correct signal and is never polluted by template text.
  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    const patientMessages = conversationHistory.filter(
      (entry) => entry?.sender === 'patient' && entry?.message?.trim()
    );
    if (patientMessages.length > 0) {
      return patientMessages[patientMessages.length - 1].message.trim();
    }
  }

  // Fall back to prompt only when history is absent (direct/test calls).
  if (typeof prompt === 'string' && prompt.trim()) {
    return prompt.trim();
  }

  return '';
}

app.use(cors());
app.use(express.json());

app.post('/api/ai-suggestion', (req, res) => {
  try {
    const { prompt, conversationHistory = [] } = req.body || {};

    const patientMessage = extractPatientMessage(prompt, conversationHistory);
    const suggestion = generateStaticSuggestion(patientMessage);

    return res.json({ suggestion });
  } catch (error) {
    console.error('Error generating suggestion:', error?.message || error);
    return res.status(500).json({ error: 'Failed to generate suggestion.' });
  }
});

app.listen(port, () => {
  console.log(`AI backend listening on port ${port}`);
  console.log('Using rule-based suggestion engine (no external API required).');
});
