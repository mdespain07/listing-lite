import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
    fontFamily: "Helvetica",
  },
  header: {
    backgroundColor: "#1A3A32",
    paddingHorizontal: 48,
    paddingTop: 40,
    paddingBottom: 36,
    marginBottom: 0,
  },
  headerEyebrow: {
    fontSize: 8,
    color: "#8FCFB0",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
    fontFamily: "Helvetica",
  },
  headerTitle: {
    fontSize: 26,
    color: "#F4F9F7",
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#8FCFB0",
    fontFamily: "Helvetica",
  },
  body: {
    paddingHorizontal: 48,
    paddingTop: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#7A8F88",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EDE9",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    color: "#7A8F88",
    fontFamily: "Helvetica",
    flex: 1,
  },
  value: {
    fontSize: 10,
    color: "#1A3A32",
    fontFamily: "Helvetica",
    flex: 2,
    textAlign: "right",
  },
  itemCard: {
    backgroundColor: "#F4F9F7",
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  itemPhoto: {
    width: 56,
    height: 56,
    borderRadius: 4,
    objectFit: "cover",
  },
  itemPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: "#E8EDE9",
  },
  itemContent: {
    flex: 1,
  },
  itemNumber: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#7A8F88",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1A3A32",
    marginBottom: 3,
  },
  itemDetail: {
    fontSize: 9,
    color: "#4A5568",
    fontFamily: "Helvetica",
  },
  commissionBox: {
    backgroundColor: "#F4F9F7",
    borderRadius: 6,
    padding: 16,
    marginBottom: 8,
  },
  commissionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  commissionLabel: {
    fontSize: 10,
    color: "#4A5568",
    fontFamily: "Helvetica",
  },
  commissionValue: {
    fontSize: 10,
    color: "#1A3A32",
    fontFamily: "Helvetica-Bold",
  },
  commissionHighlight: {
    fontSize: 10,
    color: "#2A6B52",
    fontFamily: "Helvetica-Bold",
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#E8EDE9",
    marginTop: 8,
    marginBottom: 8,
  },
  note: {
    fontSize: 9,
    color: "#7A8F88",
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  signatureSection: {
    marginTop: 8,
  },
  signatureBox: {
    borderWidth: 1,
    borderColor: "#E8EDE9",
    borderRadius: 6,
    padding: 8,
    backgroundColor: "#FFFFFF",
    marginBottom: 6,
    alignItems: "center",
  },
  signatureImage: {
    height: 60,
    objectFit: "contain",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#C5D4CC",
    marginTop: 4,
    width: "100%",
  },
  signatureName: {
    fontSize: 9,
    color: "#4A5568",
    fontFamily: "Helvetica",
    marginTop: 4,
  },
  signatureDate: {
    fontSize: 8,
    color: "#7A8F88",
    fontFamily: "Helvetica",
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F4F9F7",
    borderTopWidth: 1,
    borderTopColor: "#E8EDE9",
    paddingVertical: 12,
    paddingHorizontal: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#7A8F88",
    fontFamily: "Helvetica",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sessionId: {
    fontSize: 7,
    color: "#C5D4CC",
    fontFamily: "Helvetica",
  },
});

function ConsignmentPDF({ client, items, sessionId, signature, signedAt }) {
  const paymentDetail = client.paymentPref === "venmo"
    ? `Venmo: ${client.venmo}`
    : `Check: ${client.address}`;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>BrightListed Consignment</Text>
          <Text style={styles.headerTitle}>Consignment Agreement</Text>
          <Text style={styles.headerSubtitle}>{signedAt}</Text>
        </View>

        <View style={styles.body}>
          {/* Client Info */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Client Information</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{client.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{client.phone}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{client.email}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Payment</Text>
              <Text style={styles.value}>{paymentDetail}</Text>
            </View>
          </View>

          {/* Items */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Consignment Items ({items.length})</Text>
            {items.map((item, i) => (
              <View key={i} style={styles.itemCard}>
                {item.photo && item.photo.startsWith("http") ? (
                  <Image style={styles.itemPhoto} src={item.photo} />
                ) : (
                  <View style={styles.itemPhotoPlaceholder} />
                )}
                <View style={styles.itemContent}>
                  <Text style={styles.itemNumber}>{item.itemNumber || `Item ${i + 1}`}</Text>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDetail}>
                    Price range: {item.floor ? `$${item.floor}` : "—"} – {item.ceiling ? `$${item.ceiling}` : "—"}
                  </Text>
                  <Text style={styles.itemDetail}>
                    If unsold after 45 days: {item.unsold === "donate" ? "Donate to charity" : "Client pickup"}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Commission */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Commission Agreement</Text>
            <View style={styles.commissionBox}>
              <View style={styles.commissionRow}>
                <Text style={styles.commissionLabel}>Seller receives</Text>
                <Text style={styles.commissionHighlight}>60% of sale price</Text>
              </View>
              <View style={styles.commissionRow}>
                <Text style={styles.commissionLabel}>BrightListed commission</Text>
                <Text style={styles.commissionValue}>40%</Text>
              </View>
              <View style={styles.divider} />
              <Text style={styles.note}>
                Items not sold within 45 days will be handled per client preference above.
                Payment issued within 7 days of sale via {paymentDetail}.
                The seller's minimum price represents the lowest acceptable sale price.
                Items may be discounted after 14 days at the seller's agreed minimum price.
              </Text>
            </View>
          </View>

          {/* Signature */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Client Signature</Text>
            <View style={styles.signatureSection}>
              {signature ? (
                <View style={styles.signatureBox}>
                  <Image style={styles.signatureImage} src={signature} />
                  <View style={styles.signatureLine} />
                </View>
              ) : (
                <View style={[styles.signatureBox, { height: 70 }]} />
              )}
              <Text style={styles.signatureName}>
                Signed by: {client.name}
              </Text>
              <Text style={styles.signatureDate}>{signedAt}</Text>
              <Text style={[styles.note, { marginTop: 8 }]}>
                By signing above, the client agrees to the consignment terms including the 60/40 commission split,
                the 45-day sales window, and the selected handling of unsold items.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>BrightListed · Listings in a Snap</Text>
          <Text style={styles.sessionId}>Session: {sessionId}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { client, items, sessionId, signature, signedAt } = body;

  try {
    const buffer = await renderToBuffer(
      <ConsignmentPDF
        client={client}
        items={items}
        sessionId={sessionId}
        signature={signature}
        signedAt={signedAt}
      />
    );

    const base64 = buffer.toString("base64");
    return NextResponse.json({ pdfBase64: base64 });
  } catch (e) {
    console.error("PDF generation error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
