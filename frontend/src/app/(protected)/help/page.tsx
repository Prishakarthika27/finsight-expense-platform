"use client"

import { useState } from "react"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Mail, MessageCircle, CheckCircle2 } from "lucide-react"

const FAQS = [
  {
    question: "How does the Bill Scanner work?",
    answer:
      "Upload a photo or PDF of your receipt. We use OCR (optical character recognition) to extract the amount, merchant name, and date, then automatically categorize and add it as an expense. You can always edit the details afterward in Expense Tracker.",
  },
  {
    question: "Is my bank statement data safe?",
    answer:
      "Yes. Bank statement PDFs are stored in a private storage bucket accessible only via secure, time-limited signed URLs. All data is protected by Row Level Security, meaning only you can ever access your own statements and transactions.",
  },
  {
    question: "What file formats are supported for Bill Scanner?",
    answer: "JPG, JPEG, PNG, and PDF files are all supported for bill scanning.",
  },
  {
    question: "Why was my expense categorized as 'Other'?",
    answer:
      "Our system first tries to match keywords from the receipt to a category. If no match is found, an AI model attempts to classify it. If both fail, it defaults to 'Other' — you can always edit the category manually in Expense Tracker.",
  },
  {
    question: "Can I edit or delete an expense after adding it?",
    answer:
      "Yes, go to Expense Tracker and use the edit (pencil) or delete (trash) icons next to any expense.",
  },
  {
    question: "How do I sign a document digitally?",
    answer:
      "Go to the Signature page, draw your signature on the canvas and save it, then upload the PDF you want signed. Your signature will be embedded in the document, which you can then download.",
  },
  {
    question: "Why does my bank statement upload show an error?",
    answer:
      "Common causes: the PDF is password-protected, it's a scanned image rather than a text-based PDF, or it doesn't contain recognizable transaction data. Try downloading a fresh copy directly from your bank's internet banking portal.",
  },
]

export default function HelpCenterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const [issueDescription, setIssueDescription] = useState("")
  const [issueSubmitted, setIssueSubmitted] = useState(false)

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch("https://formspree.io/f/xwvjgbnr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      })
      setSubmitted(true)
      setName("")
      setEmail("")
      setMessage("")
      setTimeout(() => setSubmitted(false), 4000)
    } catch {
      alert("Failed to send message. Please try again.")
    }
  }

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch("https://formspree.io/f/xvznervb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue: issueDescription }),
      })
      setIssueSubmitted(true)
      setIssueDescription("")
      setTimeout(() => setIssueSubmitted(false), 4000)
    } catch {
      alert("Failed to submit report. Please try again.")
    }
  }

  return (
    <div>
      <Topbar title="Help Center" />
      <div className="p-6 space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="flex items-center gap-2 text-emerald-600 py-4">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">
                  Thanks for reaching out! We&apos;ll get back to you soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Name</Label>
                    <Input
                      id="contact-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                <Button type="submit">Send Message</Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Report an Issue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {issueSubmitted ? (
              <div className="flex items-center gap-2 text-emerald-600 py-4">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">
                  Issue reported. Our team will look into it shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleIssueSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="issue-description">Describe the issue</Label>
                  <Textarea
                    id="issue-description"
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    rows={4}
                    placeholder="What happened? What did you expect to happen?"
                    required
                  />
                </div>
                <Button type="submit" variant="outline">Submit Report</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}