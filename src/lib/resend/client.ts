import { Resend } from "resend"

export class ResendConfigError extends Error {
  constructor() {
    super("Resend API key is not configured. See docs/SETUP.md → Resend.")
    this.name = "ResendConfigError"
  }
}

function getClient(): Resend {
  if (!process.env.RESEND_API_KEY) throw new ResendConfigError()
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@pokemonexchanges.com"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "xponetial@aol.com"

export async function sendDealAlert(deal: {
  title: string
  price: number
  marketPrice: number | null
  dealScore: number
  recommendation: string
  url: string
  listingId: string
}) {
  const resend = getClient()
  const savings = deal.marketPrice ? deal.marketPrice - deal.price : null
  const pctBelow = deal.marketPrice
    ? Math.round(((deal.marketPrice - deal.price) / deal.marketPrice) * 100)
    : null

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `🔥 Deal Alert: ${deal.title} — Score ${deal.dealScore}/100`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1877F2;margin-bottom:4px">Deal Alert</h2>
        <p style="color:#666;margin-top:0">A high-scoring deal was just found on Pokemon Exchanges</p>

        <div style="background:#f0f7ff;border:1px solid #cce0ff;border-radius:8px;padding:20px;margin:20px 0">
          <h3 style="margin:0 0 12px">${deal.title}</h3>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:4px 0;color:#666;font-size:14px">Asking Price</td>
              <td style="padding:4px 0;font-weight:bold;font-size:14px">$${deal.price.toFixed(2)}</td>
            </tr>
            ${deal.marketPrice ? `
            <tr>
              <td style="padding:4px 0;color:#666;font-size:14px">Market Price</td>
              <td style="padding:4px 0;font-size:14px">$${deal.marketPrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#666;font-size:14px">You Save</td>
              <td style="padding:4px 0;color:#16a34a;font-weight:bold;font-size:14px">$${savings!.toFixed(2)} (${pctBelow}% below market)</td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding:4px 0;color:#666;font-size:14px">Deal Score</td>
              <td style="padding:4px 0;font-size:14px">
                <span style="background:${deal.dealScore >= 75 ? "#16a34a" : "#ca8a04"};color:white;padding:2px 8px;border-radius:4px;font-weight:bold">
                  ${deal.dealScore}/100 — ${deal.recommendation.toUpperCase()}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <div style="margin-top:20px;display:flex;gap:12px">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/sourcing/${deal.listingId}"
             style="background:#1877F2;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px">
            View Deal →
          </a>
          <a href="${deal.url}"
             style="background:#f0f0f0;color:#333;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">
            View on eBay
          </a>
        </div>
      </div>
    `,
  })
}
