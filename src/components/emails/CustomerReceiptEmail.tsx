import * as React from 'react'
import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Row,
    Column,
} from '@react-email/components'

export interface CustomerReceiptLine {
    id: string
    title: string
    price: number
    quantity: number
}

export interface CustomerReceiptEmailProps {
    orderId: string
    customerName: string
    items: CustomerReceiptLine[]
    total: string
    profileUrl: string
    shippingAddress: string
    date: string
}

export function CustomerReceiptEmail({
    orderId,
    customerName,
    items,
    total,
    profileUrl,
    shippingAddress,
    date,
}: CustomerReceiptEmailProps) {
    return (
        <Html lang="uk">
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
            </Head>
            <Preview>Ваше замовлення {orderId} прийнято</Preview>
            <Body style={main}>
                <Section style={outer}>
                    <Container style={card}>
                        <Section style={hero}>
                            <Heading style={heroTitle}>Luximport</Heading>
                            <Text style={heroSubtitle}>Дякуємо за покупку</Text>
                        </Section>
                        <Section style={bodyPad}>
                            <Text style={greeting}>Вітаємо, {customerName}</Text>
                            <Text style={lead}>
                                Замовлення <strong style={strong}>{orderId}</strong>
                                {date ? <> від {date}</> : null} успішно оформлено. Нижче деталі та посилання на ваш
                                профіль.
                            </Text>
                            <Hr style={hr} />
                            <Heading as="h2" style={h2}>
                                Товари
                            </Heading>
                            <Section style={tableHead}>
                                <Row>
                                    <Column style={colProduct}>
                                        <Text style={th}>Назва</Text>
                                    </Column>
                                    <Column style={colQty}>
                                        <Text style={th}>К-ть</Text>
                                    </Column>
                                    <Column style={colPrice}>
                                        <Text style={th}>Сума</Text>
                                    </Column>
                                </Row>
                            </Section>
                            {items.map((item) => {
                                const line = item.price * item.quantity
                                const lineStr = line.toLocaleString('uk-UA', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })
                                return (
                                    <Section key={item.id} style={tableRow}>
                                        <Row>
                                            <Column style={colProduct}>
                                                <Text style={tdTitle}>{item.title}</Text>
                                            </Column>
                                            <Column style={colQty}>
                                                <Text style={td}>{item.quantity}</Text>
                                            </Column>
                                            <Column style={colPrice}>
                                                <Text style={tdPrice}>{lineStr} ₴</Text>
                                            </Column>
                                        </Row>
                                    </Section>
                                )
                            })}
                            <Hr style={hr} />
                            <Section style={totalRow}>
                                <Row>
                                    <Column>
                                        <Text style={totalLabel}>Разом</Text>
                                    </Column>
                                    <Column style={alignRight}>
                                        <Text style={totalValue}>{total}</Text>
                                    </Column>
                                </Row>
                            </Section>
                            {shippingAddress ? (
                                <>
                                    <Hr style={hr} />
                                    <Heading as="h2" style={h2}>
                                        Доставка
                                    </Heading>
                                    <Text style={muted}>{shippingAddress}</Text>
                                </>
                            ) : null}
                            <Section style={ctaWrap}>
                                <Button href={profileUrl} style={cta}>
                                    Перейти до профілю
                                </Button>
                                <Text style={linkFallback}>
                                    Якщо кнопка не відкривається:{' '}
                                    <Link href={profileUrl} style={link}>
                                        {profileUrl}
                                    </Link>
                                </Text>
                            </Section>
                            <Text style={footer}>З повагою, команда Luximport</Text>
                        </Section>
                    </Container>
                </Section>
            </Body>
        </Html>
    )
}

export default CustomerReceiptEmail

const main = {
    backgroundColor: '#e8e6e3',
    margin: '0',
    padding: '32px 16px',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const outer = {
    width: '100%',
}

const card = {
    margin: '0 auto',
    maxWidth: '600px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden' as const,
    boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
    border: '1px solid #e2e8f0',
}

const hero = {
    backgroundColor: '#0f172a',
    padding: '36px 32px',
    textAlign: 'center' as const,
}

const heroTitle = {
    color: '#f8fafc',
    fontSize: '22px',
    fontWeight: '600',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    margin: '0 0 8px',
}

const heroSubtitle = {
    color: '#c9a227',
    fontSize: '14px',
    margin: '0',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
}

const bodyPad = {
    padding: '32px 28px 40px',
}

const greeting = {
    color: '#0f172a',
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 12px',
}

const lead = {
    color: '#475569',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 24px',
}

const strong = {
    color: '#0f172a',
}

const h2 = {
    color: '#0f172a',
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    margin: '0 0 16px',
}

const hr = {
    borderColor: '#e2e8f0',
    margin: '24px 0',
}

const tableHead = {
    marginBottom: '8px',
}

const tableRow = {
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '12px',
    marginBottom: '12px',
}

const th = {
    color: '#94a3b8',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    margin: '0',
}

const tdTitle = {
    color: '#1e293b',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0',
    fontWeight: '500',
}

const td = {
    color: '#64748b',
    fontSize: '14px',
    margin: '0',
}

const tdPrice = {
    color: '#0f172a',
    fontSize: '14px',
    fontWeight: '600',
    margin: '0',
    textAlign: 'right' as const,
}

const colProduct = { width: '58%', paddingRight: '8px', verticalAlign: 'top' as const }
const colQty = { width: '14%', verticalAlign: 'top' as const }
const colPrice = { width: '28%', verticalAlign: 'top' as const }

const totalRow = {
    marginTop: '8px',
}

const totalLabel = {
    color: '#64748b',
    fontSize: '14px',
    margin: '0',
}

const totalValue = {
    color: '#0f172a',
    fontSize: '20px',
    fontWeight: '700',
    margin: '0',
    textAlign: 'right' as const,
}

const alignRight = {
    textAlign: 'right' as const,
}

const muted = {
    color: '#475569',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0',
}

const ctaWrap = {
    textAlign: 'center' as const,
    margin: '36px 0 0',
}

const cta = {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '14px 32px',
    borderRadius: '8px',
    letterSpacing: '0.02em',
}

const linkFallback = {
    color: '#94a3b8',
    fontSize: '12px',
    lineHeight: '18px',
    margin: '16px 0 0',
    wordBreak: 'break-all' as const,
}

const link = {
    color: '#c9a227',
}

const footer = {
    color: '#94a3b8',
    fontSize: '12px',
    lineHeight: '18px',
    margin: '32px 0 0',
    textAlign: 'center' as const,
}
