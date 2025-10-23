import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Modal, 
  Form, 
  Select, 
  InputNumber, 
  Button, 
  Row, 
  Col, 
  Typography, 
  Space, 
  Divider,
  Tag,
  Statistic,
  Input,
  message
} from 'antd';
import { 
  SwapOutlined, 
  GoldOutlined, 
  ToolOutlined, 
  ThunderboltOutlined, 
  CrownOutlined, 
  BankOutlined,
  CalculatorOutlined,
  ArrowLeftOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import { useTransfers } from '../context/TransferContext';
import { useCinsiSettings, CinsiOption } from '../context/CinsiSettingsContext';
import { UnitType, KaratType } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

interface TransferData {
  fromUnit: UnitType;
  toUnit: UnitType;
  amount: number;
  karat: KaratType;
  cinsi?: string;
  notes?: string;
  useSemiFinished?: boolean;
  semiFinishedAmount?: number;
  semiFinishedCinsi?: string;
}

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  defaultFromUnit?: string;
}

const TransferModal: React.FC<TransferModalProps> = React.memo(({ open, onClose, defaultFromUnit }) => {
  const { addNewTransfer } = useTransfers();
  const { cinsiOptions } = useCinsiSettings();
  const [form] = Form.useForm();
  const [transferData, setTransferData] = useState<TransferData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [useSemiFinished, setUseSemiFinished] = useState(false);
  const [semiFinishedAmount, setSemiFinishedAmount] = useState<number>(0);
  const [semiFinishedCinsi, setSemiFinishedCinsi] = useState<string>('');
  const [selectedFromUnit, setSelectedFromUnit] = useState<string>('');

  const units = [
    { value: 'ana-kasa', label: 'Ana Kasa', icon: <BankOutlined /> },
    { value: 'yarimamul', label: 'Yarımamül', icon: <GoldOutlined /> },
    { value: 'lazer-kesim', label: 'Lazer Kesim', icon: <ThunderboltOutlined /> },
    { value: 'tezgah', label: 'Tezgah', icon: <ToolOutlined /> },
    { value: 'cila', label: 'Cila', icon: <CrownOutlined /> },
    { value: 'dokum', label: 'Döküm', icon: <GoldOutlined /> },
    { value: 'tedarik', label: 'Tedarik', icon: <ToolOutlined /> },
    { value: 'satis', label: 'Satış', icon: <ShoppingCartOutlined /> }
  ];

  const karatOptions = [
    { value: '14K', label: '14 Ayar' },
    { value: '18K', label: '18 Ayar' },
    { value: '22K', label: '22 Ayar' },
    { value: '24K', label: 'Has Altın' }
  ];

  const getUnitIcon = (unitValue: string) => {
    const unit = units.find(u => u.value === unitValue);
    return unit?.icon;
  };

  const getUnitLabel = (unitValue: string) => {
    const unit = units.find(u => u.value === unitValue);
    return unit?.label;
  };

  const getAvailableUnits = () => {
    let availableUnits = units;
    
    // Döküm seçilirse sadece Ana Kasa'yı göster
    if (selectedFromUnit === 'dokum') {
      availableUnits = units.filter(unit => unit.value === 'ana-kasa');
    }
    
    // Tedarik seçilirse Ana Kasa ve Yarımamül'ü göster
    if (selectedFromUnit === 'tedarik') {
      availableUnits = units.filter(unit => 
        unit.value === 'ana-kasa' || unit.value === 'yarimamul'
      );
    }
    
    // Satış seçilirse sadece Ana Kasa'yı göster
    if (selectedFromUnit === 'satis') {
      availableUnits = units.filter(unit => unit.value === 'ana-kasa');
    }
    
    return availableUnits;
  };

  const handlePreview = () => {
    form.validateFields().then(values => {
      setTransferData(values);
      setShowPreview(true);
    });
  };

  const handleSubmit = () => {
    if (!transferData) return;
    
    // Yarı mamül kullanımı varsa önce yarı mamülden çıkış yap
    if (useSemiFinished && semiFinishedAmount && semiFinishedCinsi) {
      addNewTransfer({
        fromUnit: 'yarimamul',
        toUnit: transferData.toUnit,
        karat: transferData.karat,
        amount: semiFinishedAmount,
        cinsi: semiFinishedCinsi,
        notes: `Yarı mamül kullanımı: ${transferData.notes || ''}`
      });
    }
    
    // Ana transfer işlemi
    if (transferData.fromUnit === 'tedarik' && transferData.toUnit === 'yarimamul') {
      // Doğrudan transfer (ana kasa geçişi olmadan)
      addNewTransfer({
        fromUnit: 'tedarik',
        toUnit: 'yarimamul',
        karat: transferData.karat,
        amount: transferData.amount,
        cinsi: transferData.cinsi,
        notes: transferData.notes
      });
      
      message.success({
        content: `✅ Transfer başarılı! ${transferData.amount} gr ${transferData.karat === '24K' ? 'Has Altın' : transferData.karat.replace('K', ' Ayar')} Tedarik'ten Yarımamül'e aktarıldı.`,
        duration: 4,
        style: { marginTop: '20px' }
      });
    } else {
      // Diğer tüm transferler normal şekilde kaydedilir
      addNewTransfer({
        fromUnit: transferData.fromUnit,
        toUnit: transferData.toUnit,
        karat: transferData.karat,
        amount: transferData.amount,
        cinsi: transferData.cinsi,
        notes: transferData.notes
      });
      
      message.success({
        content: `✅ Transfer başarılı! ${transferData.amount} gr ${transferData.karat === '24K' ? 'Has Altın' : transferData.karat.replace('K', ' Ayar')} ${getUnitLabel(transferData.fromUnit)}'den ${getUnitLabel(transferData.toUnit)}'e aktarıldı.`,
        duration: 4,
        style: { marginTop: '20px' }
      });
    }
    
    handleClose();
  };

  const handleClose = () => {
    form.resetFields();
    setShowPreview(false);
    setTransferData(null);
    setUseSemiFinished(false);
    setSemiFinishedAmount(0);
    setSemiFinishedCinsi('');
    onClose();
  };

  const handleBack = () => {
    setShowPreview(false);
    setTransferData(null);
  };

  // Modal açıldığında ve defaultFromUnit değiştiğinde formu set et
  useEffect(() => {
    if (open && defaultFromUnit) {
      form.setFieldsValue({
        fromUnit: defaultFromUnit,
        karat: '14K' // Varsayılan ayar
      });
      setSelectedFromUnit(defaultFromUnit);
    }
  }, [open, defaultFromUnit, form]);

  return (
    <Modal
      title={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '20px',
          fontWeight: '600',
          color: '#1f2937'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #cbd5e1'
          }}>
            <SwapOutlined style={{ color: '#64748b', fontSize: '18px' }} />
          </div>
          <span>{showPreview ? 'Transfer Önizleme' : 'Transfer İşlemi'}</span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={900}
      style={{
        top: '20px'
      }}
      styles={{
        body: {
          padding: '24px',
          background: '#f8fafc'
        }
      }}
    >
      {!showPreview ? (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handlePreview}
          >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Kaynak Birim"
                name="fromUnit"
                rules={[{ required: true, message: 'Kaynak birim seçiniz!' }]}
              >
                <Select
                  placeholder="Kaynak birimi seçin"
                  size="large"
                  showSearch
                  optionFilterProp="children"
                  onChange={(value) => setSelectedFromUnit(value)}
                  style={{
                    border: '2px solid #d1d5db',
                    borderRadius: '8px'
                  }}
                >
                  {units.map(unit => (
                    <Option key={unit.value} value={unit.value}>
                      <Space>
                        {unit.icon}
                        {unit.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Hedef Birim"
                name="toUnit"
                rules={[{ required: true, message: 'Hedef birim seçiniz!' }]}
              >
                <Select
                  placeholder="Hedef birimi seçin"
                  size="large"
                  showSearch
                  optionFilterProp="children"
                  style={{
                    border: '2px solid #d1d5db',
                    borderRadius: '8px'
                  }}
                >
                  {getAvailableUnits().map(unit => (
                    <Option key={unit.value} value={unit.value}>
                      <Space>
                        {unit.icon}
                        {unit.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Ayar"
                name="karat"
                rules={[{ required: true, message: 'Ayar seçiniz!' }]}
                initialValue="14K"
              >
                <Select
                  placeholder="Altın ayarını seçin"
                  size="large"
                  style={{
                    border: '2px solid #d1d5db',
                    borderRadius: '8px'
                  }}
                >
                  {karatOptions.map(karat => (
                    <Option key={karat.value} value={karat.value}>
                      {karat.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Miktar (gram)"
                name="amount"
                rules={[
                  { required: true, message: 'Miktar giriniz!' },
                  { type: 'number', min: 0.01, message: 'Miktar 0.01\'den büyük olmalı!' }
                ]}
              >
                <InputNumber
                  placeholder="0.00"
                  size="large"
                  style={{ 
                    width: '100%',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px'
                  }}
                  precision={2}
                  min={0.01}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Cinsi"
                name="cinsi"
                rules={[{ required: true, message: 'Cinsi seçiniz!' }]}
              >
                <Select
                  placeholder="Cinsi seçiniz"
                  size="large"
                  allowClear
                  style={{
                    border: '2px solid #d1d5db',
                    borderRadius: '8px'
                  }}
                >
                  {cinsiOptions.map((cinsi: CinsiOption) => (
                    <Option key={cinsi.value} value={cinsi.value}>
                      {cinsi.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Yarı Mamül Kullanımı */}
            <Col xs={24}>
              <Form.Item
                label="Yarı Mamül Kullanımı"
                name="useSemiFinished"
                valuePropName="checked"
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px 16px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: useSemiFinished ? '#f6ffed' : '#fafafa',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setUseSemiFinished(!useSemiFinished)}
                >
                  <input
                    type="checkbox"
                    checked={useSemiFinished}
                    onChange={(e) => setUseSemiFinished(e.target.checked)}
                    style={{ 
                      marginRight: '12px',
                      transform: 'scale(1.5)',
                      accentColor: '#52c41a'
                    }}
                  />
                  <Text style={{ fontSize: '16px', fontWeight: '500' }}>
                    Bu transferde yarı mamül kullanılacak
                  </Text>
                </div>
              </Form.Item>
            </Col>

            {useSemiFinished && (
              <>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Kullanılan Gram"
                    name="semiFinishedAmount"
                    rules={[
                      { required: useSemiFinished, message: 'Kullanılan gram miktarını giriniz!' },
                      { type: 'number', min: 0.01, message: 'Miktar 0.01\'den büyük olmalı!' }
                    ]}
                  >
                    <InputNumber
                      placeholder="0.00"
                      min={0.01}
                      step={0.01}
                      precision={2}
                      size="large"
                      style={{ 
                        width: '100%',
                        border: '2px solid #d1d5db',
                        borderRadius: '8px'
                      }}
                      addonAfter="gr"
                      value={semiFinishedAmount}
                      onChange={(value) => setSemiFinishedAmount(value || 0)}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Yarı Mamül Cinsi"
                    name="semiFinishedCinsi"
                    rules={[
                      { required: useSemiFinished, message: 'Yarı mamül cinsi seçiniz!' }
                    ]}
                  >
                    <Select
                      placeholder="Yarı mamül cinsi seçiniz"
                      size="large"
                      allowClear
                      value={semiFinishedCinsi}
                      onChange={(value) => setSemiFinishedCinsi(value || '')}
                      style={{
                        border: '2px solid #d1d5db',
                        borderRadius: '8px'
                      }}
                    >
                      {cinsiOptions.map((cinsi: CinsiOption) => (
                        <Option key={cinsi.value} value={cinsi.value}>
                          {cinsi.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </>
            )}

            <Col xs={24}>
              <Form.Item
                label="Notlar"
                name="notes"
              >
                <Input.TextArea
                  placeholder="Transfer hakkında notlar..."
                  rows={3}
                  size="large"
                  style={{
                    border: '2px solid #d1d5db',
                    borderRadius: '8px'
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleClose} size="large">
                İptal
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                icon={<CalculatorOutlined />}
                size="large"
              >
                Önizleme
              </Button>
            </Space>
          </Form.Item>
        </Form>
        </div>
      ) : (
        <div style={{ padding: '20px 0' }}>
          {transferData && (
            <div style={{ 
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decorative background elements */}
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '100px',
                height: '100px',
                background: 'linear-gradient(135deg, #1890ff20 0%, #52c41a20 100%)',
                borderRadius: '50%',
                opacity: 0.3
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-30px',
                left: '-30px',
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #722ed120 0%, #fa8c1620 100%)',
                borderRadius: '50%',
                opacity: 0.3
              }} />

              <Space direction="vertical" size="large" style={{ width: '100%', position: 'relative', zIndex: 1 }}>
                {/* Transfer Flow Visualization */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '32px',
                  padding: '24px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '2px solid #64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {getUnitIcon(transferData.fromUnit)}
                    <Text strong style={{ fontSize: '16px', color: '#1f2937' }}>
                      {getUnitLabel(transferData.fromUnit)}
                    </Text>
                  </div>
                  
                  <div style={{ 
                    margin: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '2px',
                      background: '#64748b',
                      borderRadius: '1px'
                    }} />
                    <SwapOutlined style={{ 
                      fontSize: '20px', 
                      color: '#64748b',
                      background: 'white',
                      padding: '8px',
                      borderRadius: '50%',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: '1px solid #e5e7eb'
                    }} />
                    <div style={{
                      width: '40px',
                      height: '2px',
                      background: '#64748b',
                      borderRadius: '1px'
                    }} />
                  </div>
                  
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '2px solid #64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {getUnitIcon(transferData.toUnit)}
                    <Text strong style={{ fontSize: '16px', color: '#1f2937' }}>
                      {getUnitLabel(transferData.toUnit)}
                    </Text>
                  </div>
                </div>

                {/* Transfer Details Cards */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <div style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <div style={{ marginBottom: '12px' }}>
                        <Text style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Transfer Miktarı</Text>
                      </div>
                      <div style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '8px'
                      }}>
                        {transferData.amount.toFixed(2)} gr
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b',
                        background: '#f8fafc',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        display: 'inline-block',
                        border: '1px solid #e5e7eb'
                      }}>
                        Altın Miktarı
                      </div>
                    </div>
                  </Col>
                  
                  <Col xs={24} sm={12}>
                    <div style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <div style={{ marginBottom: '12px' }}>
                        <Text style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Altın Ayarı</Text>
                      </div>
                      <div style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '8px'
                      }}>
                        {transferData.karat === '24K' ? 'Has Altın' : transferData.karat.replace('K', ' Ayar')}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b',
                        background: '#f8fafc',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        display: 'inline-block',
                        border: '1px solid #e5e7eb'
                      }}>
                        Saflık Oranı
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Cinsi Information */}
                {transferData.cinsi && (
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center'
                  }}>
                    <div style={{ marginBottom: '12px' }}>
                      <Text style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Altın Cinsi</Text>
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#1f2937',
                      marginBottom: '8px'
                    }}>
                      {cinsiOptions.find((c: CinsiOption) => c.value === transferData.cinsi)?.label || transferData.cinsi}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#64748b',
                      background: '#f8fafc',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      display: 'inline-block',
                      border: '1px solid #e5e7eb'
                    }}>
                      Altın Türü
                    </div>
                  </div>
                )}

                {/* Yarı Mamül Kullanımı Bilgisi */}
                {useSemiFinished && semiFinishedAmount && semiFinishedCinsi && (
                  <div style={{
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '2px solid #f59e0b',
                    textAlign: 'center'
                  }}>
                    <div style={{ marginBottom: '16px' }}>
                      <Space>
                        <GoldOutlined style={{ color: '#f59e0b', fontSize: '20px' }} />
                        <Text strong style={{ color: '#92400e', fontSize: '16px' }}>Yarı Mamül Kullanımı</Text>
                      </Space>
                    </div>
                    
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12}>
                        <div style={{
                          background: 'white',
                          borderRadius: '8px',
                          padding: '16px',
                          border: '1px solid #f59e0b'
                        }}>
                          <Text style={{ color: '#64748b', fontSize: '12px', fontWeight: '500' }}>Kullanılan Miktar</Text>
                          <div style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#92400e',
                            marginTop: '4px'
                          }}>
                            {semiFinishedAmount} gr
                          </div>
                        </div>
                      </Col>
                      
                      <Col xs={24} sm={12}>
                        <div style={{
                          background: 'white',
                          borderRadius: '8px',
                          padding: '16px',
                          border: '1px solid #f59e0b'
                        }}>
                          <Text style={{ color: '#64748b', fontSize: '12px', fontWeight: '500' }}>Yarı Mamül Cinsi</Text>
                          <div style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#92400e',
                            marginTop: '4px'
                          }}>
                            {cinsiOptions.find((c: CinsiOption) => c.value === semiFinishedCinsi)?.label || semiFinishedCinsi}
                          </div>
                        </div>
                      </Col>
                    </Row>
                    
                    <div style={{
                      marginTop: '16px',
                      padding: '12px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid #f59e0b'
                    }}>
                      <Text style={{ color: '#92400e', fontSize: '14px', fontWeight: '500' }}>
                        ⚠️ Bu miktar yarı mamül biriminden düşülecek
                      </Text>
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                {transferData.notes && (
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ marginBottom: '16px' }}>
                      <Text strong style={{ color: '#1f2937', fontSize: '16px' }}>
                        📝 Transfer Notları
                      </Text>
                    </div>
                    <div style={{ 
                      padding: '16px', 
                      background: '#f8fafc', 
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <Text style={{ color: '#64748b', lineHeight: '1.6' }}>
                        {transferData.notes}
                      </Text>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  gap: '16px',
                  marginTop: '32px',
                  padding: '24px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <Button 
                    onClick={handleBack} 
                    size="large"
                    style={{
                      borderRadius: '8px',
                      height: '48px',
                      padding: '0 24px',
                      border: '1px solid #d1d5db',
                      background: 'white',
                      color: '#64748b',
                      fontWeight: '500'
                    }}
                  >
                    <ArrowLeftOutlined /> Geri
                  </Button>
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={handleSubmit}
                    icon={<SwapOutlined />}
                    style={{
                      borderRadius: '8px',
                      height: '48px',
                      padding: '0 32px',
                      fontWeight: '500'
                    }}
                  >
                    Transferi Onayla
                  </Button>
                </div>
              </Space>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
});

export default TransferModal;

