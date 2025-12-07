# 📑 Säljredo-checklista (Datarum & DD)

Målet: samla alla siffror och dokument som krävs för att ett företag ska vara DD-klart och “säljredo”, samt ge tydlig gap-feedback.

## 1) Finansiellt
- Årsredovisningar + revisionsberättelser (3–5 år, PDF).
- Månadsbokslut (LTM + YTD) inkl. resultat- och balansrapport.
- Huvudbok (LTM + YTD, gärna CSV/XLSX).
- AR/AP-aging (kund/leverantörsreskontra med åldersanalys).
- Top-10 kunder/leverantörer (andel, intäkter/inköp).
- EBITDA-bridge (engångsposter + bevis).
- Kassaflödesprognos / budget (12–24 mån).
- Lagerlista + lagervärderingsprinciper.
- Anläggningsregister + avskrivningar.
- Skuld/finansieringsöversikt + covenant-status.

Fält (strukturera i UI):
- Perioder (från–till), valuta, FY/LTM/YTD.
- EBITDA justeringar (belopp + beskrivning + evidens).
- Marginaler per produkt/segment (om tillämpligt).

Gap-feedback:
- Saknade år eller saknade AR/AP-aging.
- Obekräftade engångsposter utan underlag.
- Avvikelser mellan ÅR och månadsbokslut.

## 2) Skatt
- Deklarationer 3–5 år (inkomst, moms, arbetsgivaravgifter).
- Tax rulings/pågående dialoger/tvister.
- Transfer pricing-dokumentation (om relevant).
- Uppskjutna skatter, avsättningar, underskottsavdrag.

Gap-feedback:
- Saknade deklarationer per år.
- Avsaknad av TP-dokumentation trots koncernflöden.

## 3) Juridik & Bolagsformalia
- Registreringsbevis, bolagsordning, aktiebok/cap table, ägaravtal.
- Styrelse- och stämmoprotokoll (3–5 år).
- Väsentliga avtal: kund, leverantör, hyra/lease, agent/återförsäljare, distribution, JV/licens/franchise.
- Pant-/säkerhetsavtal, lån, borgen; försäkringar + skadehistorik.
- Tvister/claims, myndighetsärenden.
- GDPR/Privacy: biträdesavtal, registerförteckningar, policies.

Gap-feedback:
- Saknade signaturer/nyaste versioner av avtal.
- Ingen tvistelista eller myndighetsärenden dokumenterade.

## 4) HR/Personal
- Anställningsavtal (nyckelpersoner/ledning), konkurrensklausuler.
- Lön/bonusstruktur, incitaments-/optionsprogram.
- Pensionsåtaganden, semester- och kompskuld.
- Fackliga relationer/kollektivavtal; policyer (uppförandekod, arbetsmiljö).

Gap-feedback:
- Saknade avtal för nyckelpersoner.
- Ej dokumenterade pensionsåtaganden/semesterlöneskuld.

## 5) Kommersiellt/Go-to-market
- Kund-/produktmix, churn/retention, LTV/CAC (om SaaS).
- Pipeline/orderbok, prishöjningshistorik.
- Partner/återförsäljare, provision/kickbacks.
- SLA/servicenivåer, kundnöjdhet (NPS), framgångshistorik/referenser.

Gap-feedback:
- Ingen topplista på kunder/leverantörer.
- Ingen dokumenterad pipeline/orderbok.

## 6) IT / Infosec / IP
- Systemkarta (ERP/CRM/BI/integrationer), licenser, ägande.
- Infosec-policy, accesskontroller, backup/DR-plan, incidenthistorik.
- GDPR/tekniska kontroller: loggning, behörighet, data retention.
- IP/kod: äganderätt, open-source compliance, licenser.

Gap-feedback:
- Saknad access-/behörighetslista.
- Ingen dokumenterad DR/backup-plan.
- Oklar äganderätt till IP/kod.

## 7) Operation / ESG / Övrigt
- Processdokumentation (order-to-cash, procure-to-pay, forecast-to-deliver).
- HSE/ESG (om relevant), certifikat, miljö-/arbetsmiljöpolicy.
- Leasing-/hyresavtal, underhållsplaner.

Gap-feedback:
- Ej dokumenterade kärnprocesser.
- Saknade certifikat eller policyer som utlovats.

## 8) Scoring & status
- Score per kategori (ex: Finans 30%, Juridik 20%, Skatt 15%, HR 15%, Kommersiellt 15%, IT 5%).
- Status per kategori: Grön (100% krav uppfyllda), Gul (kritiska dokument saknas), Röd (många kritiska gap).
- Gap-rapport: för varje krav → “saknas” / “ofullständigt” + åtgärd.

## 9) Metadata & automation (för implementation)
- Auto-tagga uppladdade filer med GPT-5.1: kategori, typ, år, signerad/ej.
- Spara metadata: {kategori, typ, period, signerad, format, källa, laddad av, datum}.
- Koppla varje fil mot ett krav i checklistan; räkna uppfyllelse.

## 10) Notiser & påminnelser
- Påminnelsemail när kritiska dokument saknas (per kategori).
- Påminnelse vid saknad AR/AP-aging, ÅR eller signerade nyckelavtal.
- Sammanfattande veckorapport: gap + readiness-score.

## 11) Audit & spårbarhet
- Logga uppladdning, visning, radering, versionering (S3-versioning finns).
- Visa versionshistorik i UI och vem som gjort ändringar.

## 12) “Klar för DD”-kriterier
- Alla obligatoriska krav täckta (Finans/Juridik/Skatt utan kritiska gap).
- Top-10 kund/leverantör + AR/AP-aging finns.
- Underlag för EBITDA-bridge upplagt och styrkt.
- GDPR/infosec dokumenterat; anställningsavtal nyckelpersoner finns.
- Tvistelista + försäkringar + låne-/pantöversikt klara.

