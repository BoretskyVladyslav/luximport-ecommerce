import * as React from 'react';
import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from '@react-email/components';

interface OrderItem {
    id: string;
    title: string;
    price: number;
    quantity: number;
}

interface CustomerReceiptEmailProps {
    orderId: string;
    customerName: string;
    items: OrderItem[];
    total: string;
    shippingAddress: string;
    date: string;
}

export const CustomerReceiptEmail = ({
    orderId,
    customerName,
    items,
    total,
    shippingAddress,
    date,
}: CustomerReceiptEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Підтвердження вашого замовлення {orderId}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Дякуємо за замовлення</Heading>
                    <Text style={text}>Шановний(а) {customerName},</Text>
                    <Text style={text}>
                        Ваше замовлення <strong>{orderId}</strong> від {date} успішно оформлено.
                    </Text>
                    <Hr style={hr} />

                    <Section style={section}>
                        <Heading as="h2" style={h2}>Деталі замовлення</Heading>
                        {items.map((item) => (
                            <Section key={item.id} style={itemRow}>
                                <Text style={itemTitle}>{item.title} (x{item.quantity})</Text>
                                <Text style={itemPrice}>{(item.price * item.quantity).toLocaleString('uk-UA')} ₴</Text>
                            </Section>
                        ))}
                    </Section>

                    <Hr style={hr} />
                    <Section style={totalRow}>
                        <Text style={totalLabel}>Разом:</Text>
                        <Text style={totalValue}>{total}</Text>
                    </Section>
                    <Hr style={hr} />

                    <Section style={section}>
                        <Heading as="h2" style={h2}>Доставка</Heading>
                        <Text style={text}>{shippingAddress}</Text>
                    </Section>

                    <Text style={footer}>
                        З повагою,<br />
                        Команда Luximport
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default CustomerReceiptEmail;

const main = {
    backgroundColor: '#fdfdfc',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '40px 20px',
    maxWidth: '600px',
};

const h1 = {
    color: '#1a1a1a',
    fontSize: '24px',
    fontWeight: '300',
    lineHeight: '40px',
    margin: '0 0 20px',
    textAlign: 'center' as const,
    letterSpacing: '1px',
};

const h2 = {
    color: '#1a1a1a',
    fontSize: '18px',
    fontWeight: '400',
    lineHeight: '28px',
    margin: '0 0 16px',
};

const text = {
    color: '#4a4a4a',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 16px',
};

const section = {
    margin: '24px 0',
};

const itemRow = {
    display: 'table',
    width: '100%',
    marginBottom: '12px',
};

const itemTitle = {
    display: 'table-cell',
    color: '#4a4a4a',
    fontSize: '14px',
    margin: '0',
};

const itemPrice = {
    display: 'table-cell',
    color: '#1a1a1a',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'right' as const,
    margin: '0',
};

const totalRow = {
    display: 'table',
    width: '100%',
    margin: '16px 0',
};

const totalLabel = {
    display: 'table-cell',
    color: '#1a1a1a',
    fontSize: '16px',
    fontWeight: '500',
    margin: '0',
};

const totalValue = {
    display: 'table-cell',
    color: '#1a1a1a',
    fontSize: '18px',
    fontWeight: '600',
    textAlign: 'right' as const,
    margin: '0',
};

const hr = {
    borderColor: '#eaeaea',
    margin: '24px 0',
};

const footer = {
    color: '#888888',
    fontSize: '13px',
    lineHeight: '20px',
    marginTop: '48px',
    textAlign: 'center' as const,
};
