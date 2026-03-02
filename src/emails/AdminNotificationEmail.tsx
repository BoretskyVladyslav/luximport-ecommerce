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
    Row,
    Column,
} from '@react-email/components';

interface OrderItem {
    id: string;
    title: string;
    price: number;
    quantity: number;
}

interface AdminNotificationEmailProps {
    orderId: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    items: OrderItem[];
    total: string;
    shippingAddress: string;
    date: string;
}

export const AdminNotificationEmail = ({
    orderId,
    customerName,
    customerPhone,
    customerEmail,
    items,
    total,
    shippingAddress,
    date,
}: AdminNotificationEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Нове замовлення: {orderId}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Нове замовлення {orderId}</Heading>

                    <Section style={section}>
                        <Heading as="h2" style={h2}>Контактні дані</Heading>
                        <Text style={text}><strong>Ім'я:</strong> {customerName}</Text>
                        <Text style={text}><strong>Телефон:</strong> {customerPhone}</Text>
                        {customerEmail && <Text style={text}><strong>Email:</strong> {customerEmail}</Text>}
                        <Text style={text}><strong>Дата:</strong> {date}</Text>
                    </Section>

                    <Hr style={hr} />

                    <Section style={section}>
                        <Heading as="h2" style={h2}>Товари</Heading>
                        {items.map((item) => (
                            <Section key={item.id} style={itemRow}>
                                <Text style={itemTitle}>{item.title} (x{item.quantity})</Text>
                                <Text style={itemPrice}>{(item.price * item.quantity).toLocaleString('uk-UA')} ₴</Text>
                            </Section>
                        ))}
                    </Section>

                    <Hr style={hr} />
                    <Section style={totalRow}>
                        <Text style={totalLabel}>Сума:</Text>
                        <Text style={totalValue}>{total}</Text>
                    </Section>
                    <Hr style={hr} />

                    <Section style={section}>
                        <Heading as="h2" style={h2}>Доставка</Heading>
                        <Text style={text}>{shippingAddress}</Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default AdminNotificationEmail;

const main = {
    backgroundColor: '#f5f5f5',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '40px 20px',
    maxWidth: '600px',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    border: '1px solid #eaeaea',
};

const h1 = {
    color: '#1a1a1a',
    fontSize: '22px',
    fontWeight: '600',
    lineHeight: '32px',
    margin: '0 0 24px',
};

const h2 = {
    color: '#4a4a4a',
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '24px',
    margin: '0 0 12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
};

const text = {
    color: '#4a4a4a',
    fontSize: '14px',
    lineHeight: '24px',
    margin: '0 0 8px',
};

const section = {
    margin: '24px 0',
};

const itemRow = {
    display: 'table',
    width: '100%',
    marginBottom: '8px',
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
    fontWeight: '600',
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
    margin: '20px 0',
};
