// Generated from examples/*/ — illustrative inputs in the documented response shapes, not real model outputs.
window.SOURCE_BOUND_EXAMPLES = [
  {
    "id": "email",
    "title": "Shipping email (ScaleDown Extract shape)",
    "source": "From: ops@northwind-logistics.example\nSubject: Delay on order 44-1829\n\nHi Priya,\n\nYour order 44-1829 (2 cartons, 18.4 kg) reached the Leicester depot at 06:40 on 14 Oct.\nCustoms hold: HS code 6110.20 flagged for review by Zöllner Brokerage.\nNew delivery estimate: 17 Oct. Carrier reference: NWL-77310.\n\nRegards,\nTomás Ruiz",
    "extraction": {
      "entities": [
        {
          "text": "44-1829",
          "type": "order_id",
          "confidence": 0.98,
          "start": 93,
          "end": 100,
          "context": "Your order 44-1829 (2 cartons"
        },
        {
          "text": "18.4 kg",
          "type": "weight",
          "confidence": 0.95,
          "start": 113,
          "end": 120,
          "context": "2 cartons, 18.4 kg) reached"
        },
        {
          "text": "6110.20",
          "type": "hs_code",
          "confidence": 0.91,
          "start": 192,
          "end": 199,
          "context": "HS code 6110.20 flagged"
        },
        {
          "text": "Zöllner Brokerage",
          "type": "customs_broker",
          "confidence": 0.88,
          "start": 222,
          "end": 239,
          "context": "review by Zöllner Brokerage."
        },
        {
          "text": "17 Oct",
          "type": "new_delivery_date",
          "confidence": 0.86,
          "start": 162,
          "end": 168,
          "context": "estimate: 17 Oct."
        },
        {
          "text": "NWL-77130",
          "type": "carrier_reference",
          "confidence": 0.83,
          "start": 291,
          "end": 300,
          "context": "Carrier reference: NWL-77310."
        },
        {
          "text": "",
          "type": "insurance_value",
          "confidence": 0,
          "start": 0,
          "end": 0,
          "context": ""
        },
        {
          "text": "Tomás Ruiz",
          "type": "sender_name",
          "confidence": 0.97,
          "start": 312,
          "end": 322,
          "context": "Regards,\nTomás Ruiz"
        }
      ]
    }
  },
  {
    "id": "hindi",
    "title": "Hindi delivery note: offsets in bytes",
    "source": "ऑर्डर 44-1829 लेस्टर डिपो पहुँच गया है। नई डिलीवरी तारीख 17 अक्टूबर है। संदर्भ: NWL-77310",
    "extraction": {
      "entities": [
        {
          "text": "44-1829",
          "type": "order_id",
          "confidence": 0.97,
          "start": 16,
          "end": 23,
          "context": ""
        },
        {
          "text": "लेस्टर डिपो",
          "type": "location",
          "confidence": 0.9,
          "start": 24,
          "end": 55,
          "context": ""
        },
        {
          "text": "17 अक्टूबर",
          "type": "new_delivery_date",
          "confidence": 0.92,
          "start": 137,
          "end": 161,
          "context": ""
        },
        {
          "text": "NWL-77310",
          "type": "carrier_reference",
          "confidence": 0.95,
          "start": 192,
          "end": 201,
          "context": ""
        }
      ]
    }
  },
  {
    "id": "contract",
    "title": "Contract clause (Anthropic citations shape)",
    "source": "7.2 Termination. Either party may terminate this Agreement for convenience on thirty (30) days' written notice to the other party.\n7.3 Fees on termination. On termination under clause 7.2 the Customer shall pay all fees accrued up to the termination date.\n9.1 Liability cap. Each party's total liability shall not exceed the fees paid in the twelve (12) months before the claim.",
    "extraction": {
      "citations": [
        {
          "type": "char_location",
          "cited_text": "Either party may terminate this Agreement for convenience on thirty (30) days' written notice to the other party.",
          "document_index": 0,
          "start_char_index": 17,
          "end_char_index": 130
        },
        {
          "type": "char_location",
          "cited_text": "the Customer shall pay  all fees accrued up to the\ntermination date.",
          "document_index": 0,
          "start_char_index": 188,
          "end_char_index": 255
        },
        {
          "type": "char_location",
          "cited_text": "Each party's total liability shall not exceed twice the fees paid in the twelve (12) months before the claim.",
          "document_index": 0,
          "start_char_index": 275,
          "end_char_index": 378
        }
      ]
    }
  },
  {
    "id": "invoice",
    "title": "Freight invoice (Google LangExtract shape)",
    "source": "INVOICE No. INV-2026-0418\nBill to: Harbour Freight Traders Ltd, 12 Quay Road, Felixstowe IP11 3DL\nDate: 2 Oct 2026    Due: 1 Nov 2026\nOcean freight Shanghai to Felixstowe, 1 x 40ft container    USD 3,840.00\nTerminal handling                                            USD   265.00\nTotal due                                                    USD 4,105.00",
    "extraction": {
      "extractions": [
        {
          "extraction_class": "invoice_number",
          "extraction_text": "INV-2026-0418",
          "char_interval": {
            "start_pos": 12,
            "end_pos": 25
          },
          "alignment_status": "match_exact"
        },
        {
          "extraction_class": "customer",
          "extraction_text": "Harbour Freight Traders Ltd",
          "char_interval": {
            "start_pos": 35,
            "end_pos": 62
          },
          "alignment_status": "match_exact"
        },
        {
          "extraction_class": "due_date",
          "extraction_text": "1 Nov 2026",
          "char_interval": {
            "start_pos": 123,
            "end_pos": 133
          },
          "alignment_status": "match_exact"
        },
        {
          "extraction_class": "total",
          "extraction_text": "USD 4,105.00",
          "char_interval": {
            "start_pos": 342,
            "end_pos": 354
          },
          "alignment_status": "match_exact"
        },
        {
          "extraction_class": "total",
          "extraction_text": "USD 4,150.00",
          "char_interval": {
            "start_pos": 342,
            "end_pos": 354
          },
          "alignment_status": "match_fuzzy"
        }
      ]
    }
  }
];
