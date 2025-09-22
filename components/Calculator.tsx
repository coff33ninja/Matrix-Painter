import React, { useState, useEffect } from 'react';
import { Calculator as CalculatorIconLucide, Zap, Info, AlertTriangle, Thermometer, Eye, Cpu } from 'lucide-react';

interface LedSpec {
  forwardVoltage: number;
  forwardCurrent: number;
  powerRating: number;
  efficiency: number;
  lumens: number;
  cct: number;
  cri: number;
  binTolerance: number;
}

interface WireSpec {
  resistance: number;
  ampacity: number;
}

interface Inputs {
  ledType: string;
  length: number;
  ledsPerMeter: number;
  supplyVoltage: number;
  supplyAmps: number;
  customForwardVoltage: number;
  customForwardCurrent: number;
  customLumens: number;
  customCCT: number;
  customCRI: number;
  efficiency: number;
  ambientTemp: number;
  coolingFactor: number;
  wireGauge: number;
  wireLength: number;
  dimmingType: 'none' | 'linear' | 'pwm';
  dimmingDepth: number;
  pwmFrequency: number;
  constantCurrent: boolean;
  targetLifetime: number;
  costPerKWh: number;
  operatingHours: number;
  includeDriver: boolean;
  driverType: 'linear' | 'switching' | 'buck_boost';
  binningTolerance: number;
}

interface Results {
  totalLEDs?: number;
  singleLEDPower?: number;
  totalLEDPower?: number;
  maxLEDsInSeries?: number;
  parallelStrings?: number;
  actualLEDsInSeries?: number;
  resistorValue?: number;
  resistorPower?: number;
  totalResistorPower?: number;
  recommendedResistorWattage?: number;
  driverPower?: number;
  driverEfficiency?: number;
  filterCapacitor?: number;
  decouplingCapacitors?: number;
  protectionDiodeCurrent?: number;
  protectionDiodePower?: number;
  fuseCurrent?: number;
  switchingCurrent?: number;
  switchingPower?: number;
  wireVoltageDropOneWay?: number;
  wireVoltageDrop?: number;
  wirePowerLoss?: number;
  effectiveSupplyVoltage?: number;
  totalHeatGenerated?: number;
  temperatureRise?: number;
  heatSinkRequired?: boolean;
  adjustedLifetime?: number;
  totalSystemPower?: number;
  efficiency?: number;
  recommendedPSVoltage?: number;
  recommendedPSCurrent?: number;
  recommendedPSPower?: number;
  totalLumens?: number;
  lumensPerWatt?: number;
  lumensPerMeter?: number;
  ledCCT?: number;
  ledCRI?: number;
  cctVariation?: number;
  powerPerMeter?: number;
  currentPerMeter?: number;
  tempDeratingFactor?: number;
  dimmingEfficiency?: number;
  annualEnergyConsumption?: number;
  annualOperatingCost?: number;
}

interface InputGroupProps {
  label: string;
  children: React.ReactNode;
  info?: string;
}

export const Calculator = () => {
  const [inputs, setInputs] = useState<Inputs>({
    ledType: 'white_3mm',
    length: 1,
    ledsPerMeter: 60,
    supplyVoltage: 12,
    supplyAmps: 2,
    customForwardVoltage: 3.2,
    customForwardCurrent: 20,
    customLumens: 20,
    customCCT: 6500,
    customCRI: 80,
    efficiency: 85,
    ambientTemp: 25,
    coolingFactor: 1.0,
    wireGauge: 18,
    wireLength: 5,
    dimmingType: 'none',
    dimmingDepth: 100,
    pwmFrequency: 1000,
    constantCurrent: false,
    targetLifetime: 50000,
    costPerKWh: 0.12,
    operatingHours: 8,
    includeDriver: false,
    driverType: 'linear',
    binningTolerance: 5
  });

  const [results, setResults] = useState<Results>({});
  const [warnings, setWarnings] = useState<string[]>([]);

  // Enhanced LED specifications database with optical properties
  const ledSpecs: Record<string, LedSpec> = {
    'white_3mm': { forwardVoltage: 3.2, forwardCurrent: 20, powerRating: 0.064, efficiency: 85, lumens: 20, cct: 6500, cri: 80, binTolerance: 5 },
    'white_5mm': { forwardVoltage: 3.2, forwardCurrent: 25, powerRating: 0.080, efficiency: 85, lumens: 25, cct: 6500, cri: 80, binTolerance: 5 },
    'warm_white_3mm': { forwardVoltage: 3.2, forwardCurrent: 20, powerRating: 0.064, efficiency: 85, lumens: 18, cct: 3000, cri: 85, binTolerance: 5 },
    'warm_white_5mm': { forwardVoltage: 3.2, forwardCurrent: 25, powerRating: 0.080, efficiency: 85, lumens: 22, cct: 3000, cri: 85, binTolerance: 5 },
    'red_3mm': { forwardVoltage: 2.0, forwardCurrent: 20, powerRating: 0.040, efficiency: 90, lumens: 8, cct: 0, cri: 0, binTolerance: 3 },
    'red_5mm': { forwardVoltage: 2.0, forwardCurrent: 25, powerRating: 0.050, efficiency: 90, lumens: 12, cct: 0, cri: 0, binTolerance: 3 },
    'blue_3mm': { forwardVoltage: 3.4, forwardCurrent: 20, powerRating: 0.068, efficiency: 80, lumens: 5, cct: 0, cri: 0, binTolerance: 4 },
    'blue_5mm': { forwardVoltage: 3.4, forwardCurrent: 25, powerRating: 0.085, efficiency: 80, lumens: 8, cct: 0, cri: 0, binTolerance: 4 },
    'green_3mm': { forwardVoltage: 3.2, forwardCurrent: 20, powerRating: 0.064, efficiency: 88, lumens: 15, cct: 0, cri: 0, binTolerance: 4 },
    'green_5mm': { forwardVoltage: 3.2, forwardCurrent: 25, powerRating: 0.080, efficiency: 88, lumens: 20, cct: 0, cri: 0, binTolerance: 4 },
    'yellow_3mm': { forwardVoltage: 2.1, forwardCurrent: 20, powerRating: 0.042, efficiency: 85, lumens: 12, cct: 0, cri: 0, binTolerance: 3 },
    'uv_5mm': { forwardVoltage: 3.6, forwardCurrent: 20, powerRating: 0.072, efficiency: 75, lumens: 0, cct: 0, cri: 0, binTolerance: 6 },
    'ir_5mm': { forwardVoltage: 1.4, forwardCurrent: 100, powerRating: 0.140, efficiency: 95, lumens: 0, cct: 0, cri: 0, binTolerance: 2 },
    'rgb_5mm': { forwardVoltage: 3.2, forwardCurrent: 20, powerRating: 0.192, efficiency: 80, lumens: 15, cct: 0, cri: 95, binTolerance: 5 },
    'high_power_1w': { forwardVoltage: 3.4, forwardCurrent: 350, powerRating: 1.0, efficiency: 85, lumens: 100, cct: 6500, cri: 80, binTolerance: 4 },
    'high_power_3w': { forwardVoltage: 3.6, forwardCurrent: 700, powerRating: 3.0, efficiency: 90, lumens: 280, cct: 6500, cri: 80, binTolerance: 4 },
    'high_power_5w': { forwardVoltage: 3.8, forwardCurrent: 1400, powerRating: 5.0, efficiency: 92, lumens: 480, cct: 6500, cri: 80, binTolerance: 4 },
    'cob_10w': { forwardVoltage: 12.0, forwardCurrent: 900, powerRating: 10.0, efficiency: 88, lumens: 900, cct: 5000, cri: 85, binTolerance: 3 },
    'cob_20w': { forwardVoltage: 24.0, forwardCurrent: 900, powerRating: 20.0, efficiency: 90, lumens: 1900, cct: 5000, cri: 85, binTolerance: 3 },
    'smd_2835': { forwardVoltage: 3.0, forwardCurrent: 60, powerRating: 0.2, efficiency: 90, lumens: 22, cct: 6500, cri: 80, binTolerance: 4 },
    'smd_5050': { forwardVoltage: 3.2, forwardCurrent: 60, powerRating: 0.24, efficiency: 85, lumens: 18, cct: 6500, cri: 80, binTolerance: 5 },
    'smd_3528': { forwardVoltage: 3.2, forwardCurrent: 20, powerRating: 0.08, efficiency: 80, lumens: 8, cct: 6500, cri: 75, binTolerance: 5 },
    'addressable_ws2812b': { forwardVoltage: 5.0, forwardCurrent: 60, powerRating: 0.3, efficiency: 75, lumens: 16, cct: 0, cri: 85, binTolerance: 6 },
    'custom': { forwardVoltage: 0, forwardCurrent: 0, powerRating: 0, efficiency: 85, lumens: 0, cct: 0, cri: 80, binTolerance: 5 }
  };

  // Wire gauge specifications (AWG)
  const wireSpecs: Record<number, WireSpec> = {
    12: { resistance: 0.00193, ampacity: 20 },
    14: { resistance: 0.00307, ampacity: 15 },
    16: { resistance: 0.00488, ampacity: 10 },
    18: { resistance: 0.00775, ampacity: 7 },
    20: { resistance: 0.01232, ampacity: 5 },
    22: { resistance: 0.01959, ampacity: 3 },
    24: { resistance: 0.03115, ampacity: 2 }
  };

  const calculatePower = () => {
    const currentWarnings: string[] = [];
    
    // Get LED specifications
    const ledSpec = inputs.ledType === 'custom' 
      ? {
          forwardVoltage: inputs.customForwardVoltage,
          forwardCurrent: inputs.customForwardCurrent,
          powerRating: (inputs.customForwardVoltage * inputs.customForwardCurrent) / 1000,
          efficiency: inputs.efficiency,
          lumens: inputs.customLumens,
          cct: inputs.customCCT,
          cri: inputs.customCRI,
          binTolerance: inputs.binningTolerance
        }
      : ledSpecs[inputs.ledType];

    // Basic calculations
    const totalLEDs = inputs.length * inputs.ledsPerMeter;
    const ledForwardVoltage = ledSpec.forwardVoltage;
    const ledForwardCurrent = ledSpec.forwardCurrent / 1000; // Convert mA to A
    const singleLEDPower = ledForwardVoltage * ledForwardCurrent;
    
    // Temperature derating with improved model
    const tempDeratingFactor = inputs.ambientTemp > 25 
      ? Math.max(0.5, 1 - (inputs.ambientTemp - 25) * 0.002) 
      : Math.min(1.1, 1 + (25 - inputs.ambientTemp) * 0.001);
    
    const adjustedLEDPower = singleLEDPower * tempDeratingFactor * inputs.coolingFactor;
    
    // Dimming calculations
    let dimmingEfficiency = 1.0;
    let dimmingPowerLoss = 0;
    
    if (inputs.dimmingType === 'linear') {
      dimmingEfficiency = inputs.dimmingDepth / 100;
      dimmingPowerLoss = adjustedLEDPower * totalLEDs * (1 - dimmingEfficiency);
    } else if (inputs.dimmingType === 'pwm') {
      dimmingEfficiency = inputs.dimmingDepth / 100;
      // PWM has minimal power loss in switching components
      dimmingPowerLoss = adjustedLEDPower * totalLEDs * 0.02; // 2% switching loss
    }
    
    // Total LED power consumption with dimming
    const totalLEDPower = totalLEDs * adjustedLEDPower * dimmingEfficiency;
    
    // Series/parallel configuration analysis
    const maxLEDsInSeries = Math.floor(inputs.supplyVoltage / ledForwardVoltage);
    const parallelStrings = Math.ceil(totalLEDs / maxLEDsInSeries);
    const actualLEDsInSeries = Math.ceil(totalLEDs / parallelStrings);
    
    // Current limiting resistor or constant current driver calculations
    let resistorValue = 0;
    let resistorPower = 0;
    let totalResistorPower = 0;
    let driverPower = 0;
    let driverEfficiency = 0.85;
    
    if (inputs.constantCurrent || inputs.includeDriver) {
      // Constant current driver calculations
      if (inputs.driverType === 'linear') {
        driverEfficiency = 0.75;
        driverPower = (totalLEDPower / driverEfficiency) - totalLEDPower;
      } else if (inputs.driverType === 'switching') {
        driverEfficiency = 0.90;
        driverPower = (totalLEDPower / driverEfficiency) - totalLEDPower;
      } else { // buck/boost
        driverEfficiency = 0.88;
        driverPower = (totalLEDPower / driverEfficiency) - totalLEDPower;
      }
    } else {
      // Current limiting resistor calculation
      const voltageDropAcrossLEDs = actualLEDsInSeries * ledForwardVoltage;
      const resistorVoltage = inputs.supplyVoltage - voltageDropAcrossLEDs;
      resistorValue = resistorVoltage / ledForwardCurrent;
      resistorPower = resistorVoltage * ledForwardCurrent;
      totalResistorPower = resistorPower * parallelStrings;
    }
    
    // Wire voltage drop calculations
    const wireSpec = wireSpecs[inputs.wireGauge];
    const totalCurrent = totalLEDs * ledForwardCurrent;
    const wireVoltageDropOneWay = wireSpec.resistance * inputs.wireLength * totalCurrent;
    const wireVoltageDrop = wireVoltageDropOneWay * 2; // Round trip
    const wirePowerLoss = wireSpec.resistance * inputs.wireLength * 2 * Math.pow(totalCurrent, 2);
    const effectiveSupplyVoltage = inputs.supplyVoltage - wireVoltageDrop;
    
    // Capacitor calculations (enhanced for different topologies)
    const rippleCurrent = totalCurrent * 0.1; // 10% ripple assumption
    const filterCapacitor = Math.max(100, (rippleCurrent * 1000) / (2 * Math.PI * 120 * 0.5)); // 120Hz, 0.5V ripple
    
    // Additional capacitors for high-frequency switching
    let decouplingCapacitors = 0;
    if (inputs.dimmingType === 'pwm' || inputs.constantCurrent) {
      decouplingCapacitors = Math.ceil(totalLEDs / 10) * 100; // 100nF per 10 LEDs
    }
    
    // Diode calculations (enhanced for different protection types)
    const protectionDiodeCurrent = totalCurrent;
    const protectionDiodePower = protectionDiodeCurrent * 0.7; // Schottky diode drop
    
    // Additional protection components
    const fuseCurrent = totalCurrent * 1.25; // 125% of operating current
    let fusePowerLoss = 0.1; // Typical fuse loss
    
    // Transistor/MOSFET calculations for switching/dimming
    const switchingCurrent = totalCurrent;
    let switchingPower = 0;
    
    if (inputs.dimmingType === 'pwm') {
      // MOSFET switching losses
      const rdsOn = 0.05; // 50mΩ typical for power MOSFET
      switchingPower = Math.pow(switchingCurrent, 2) * rdsOn;
      // Add switching losses
      switchingPower += (inputs.pwmFrequency / 1000) * totalLEDPower * 0.001;
    } else if (inputs.dimmingType === 'linear') {
      // Linear transistor losses
      const vceDropout = inputs.supplyVoltage - (actualLEDsInSeries * ledForwardVoltage);
      switchingPower = vceDropout * switchingCurrent * (1 - dimmingEfficiency);
    }
    
    // Heat sink calculations for high power applications
    let heatSinkRequired = false;
    const totalHeatGenerated = driverPower + totalResistorPower + switchingPower + dimmingPowerLoss;
    const thermalResistance = 10; // °C/W typical for small heat sink
    const temperatureRise = totalHeatGenerated * thermalResistance;
    
    if (inputs.ambientTemp + temperatureRise > 85) {
      heatSinkRequired = true;
    }
    
    // Total system power
    const totalSystemPower = totalLEDPower + totalResistorPower + driverPower + 
                            switchingPower + dimmingPowerLoss + wirePowerLoss + fusePowerLoss;
    const efficiency = (totalLEDPower / totalSystemPower) * 100;
    
    // Power supply requirements
    const recommendedPSCurrent = totalCurrent * 1.25; // 25% safety margin
    const recommendedPSPower = totalSystemPower * 1.25; // 25% safety margin
    
    // Optical calculations
    const totalLumens = totalLEDs * ledSpec.lumens * dimmingEfficiency * tempDeratingFactor;
    const lumensPerWatt = totalLumens / totalLEDPower;
    const lumensPerMeter = totalLumens / inputs.length;
    
    // Lifetime and cost calculations
    const lifetimeAdjustment = Math.pow(0.7, (inputs.ambientTemp - 25) / 10); // Arrhenius model
    const adjustedLifetime = inputs.targetLifetime * lifetimeAdjustment;
    const annualEnergyConsumption = (totalSystemPower / 1000) * inputs.operatingHours * 365;
    const annualOperatingCost = annualEnergyConsumption * inputs.costPerKWh;
    
    // Binning and color consistency
    const colorConsistencyWarning = ledSpec.binTolerance > 5;
    const cctVariation = ledSpec.binTolerance * 50; // Approximate CCT variation in K
    
    // Safety checks and warnings
    if (effectiveSupplyVoltage < ledForwardVoltage) {
      currentWarnings.push("Supply voltage is too low after wire voltage drop!");
    }
    
    if (wireVoltageDrop > inputs.supplyVoltage * 0.05) {
      currentWarnings.push(`Excessive wire voltage drop: ${wireVoltageDrop.toFixed(2)}V (${((wireVoltageDrop/inputs.supplyVoltage)*100).toFixed(1)}%)`);
    }
    
    if (totalCurrent > wireSpec.ampacity) {
      currentWarnings.push(`Wire gauge insufficient for current! Max: ${wireSpec.ampacity}A, Required: ${totalCurrent.toFixed(2)}A`);
    }
    
    if (resistorValue < 0) {
      currentWarnings.push("Cannot calculate resistor - supply voltage too low!");
    }
    
    if (recommendedPSCurrent > inputs.supplyAmps) {
      currentWarnings.push(`Power supply current rating insufficient! Required: ${recommendedPSCurrent.toFixed(2)}A`);
    }
    
    if (recommendedPSPower > (inputs.supplyVoltage * inputs.supplyAmps)) {
      currentWarnings.push("Power supply wattage is insufficient!");
    }
    
    if (resistorPower > 0.25) {
      currentWarnings.push(`Resistor power rating should be at least ${Math.ceil(resistorPower * 4) / 4}W`);
    }
    
    if (inputs.ambientTemp > 50) {
      currentWarnings.push("High ambient temperature will reduce LED lifespan significantly!");
    }
    
    if (efficiency < 60) {
      currentWarnings.push("Low system efficiency - consider constant current driver!");
    }
    
    if (heatSinkRequired) {
      currentWarnings.push(`Heat sink required! Temperature rise: ${temperatureRise.toFixed(1)}°C`);
    }
    
    if (inputs.pwmFrequency < 400) {
      currentWarnings.push("PWM frequency may cause visible flicker - consider >1kHz");
    }
    
    if (colorConsistencyWarning) {
      currentWarnings.push(`LED binning tolerance is high (±${ledSpec.binTolerance}%) - color matching may be poor`);
    }
    
    if (adjustedLifetime < inputs.targetLifetime * 0.7) {
      currentWarnings.push(`High temperature will significantly reduce LED lifetime to ~${(adjustedLifetime/1000).toFixed(0)}k hours`);
    }

    setWarnings(currentWarnings);
    
    setResults({
      // LED calculations
      totalLEDs,
      singleLEDPower: adjustedLEDPower * 1000, // Convert to mW
      totalLEDPower,
      
      // Configuration
      maxLEDsInSeries,
      parallelStrings,
      actualLEDsInSeries,
      
      // Resistor calculations
      resistorValue: Math.max(0, resistorValue),
      resistorPower: Math.max(0, resistorPower),
      totalResistorPower,
      recommendedResistorWattage: Math.ceil(resistorPower * 4) / 4,
      
      // Driver calculations
      driverPower,
      driverEfficiency: driverEfficiency * 100,
      
      // Component calculations
      filterCapacitor: Math.max(100, filterCapacitor),
      decouplingCapacitors,
      protectionDiodeCurrent: protectionDiodeCurrent * 1000,
      protectionDiodePower,
      fuseCurrent,
      switchingCurrent: switchingCurrent * 1000,
      switchingPower,
      
      // Wire calculations
      wireVoltageDropOneWay,
      wireVoltageDrop,
      wirePowerLoss,
      effectiveSupplyVoltage,
      
      // Thermal calculations
      totalHeatGenerated,
      temperatureRise,
      heatSinkRequired,
      adjustedLifetime,
      
      // System totals
      totalSystemPower,
      efficiency,
      recommendedPSVoltage: inputs.supplyVoltage,
      recommendedPSCurrent,
      recommendedPSPower,
      
      // Optical calculations
      totalLumens,
      lumensPerWatt,
      lumensPerMeter,
      ledCCT: ledSpec.cct,
      ledCRI: ledSpec.cri,
      cctVariation,
      
      // Additional metrics
      powerPerMeter: totalSystemPower / inputs.length,
      currentPerMeter: totalCurrent / inputs.length,
      tempDeratingFactor,
      dimmingEfficiency: dimmingEfficiency * 100,
      
      // Cost calculations
      annualEnergyConsumption,
      annualOperatingCost
    });
  };

  useEffect(() => {
    calculatePower();
  }, [inputs]);

  const handleInputChange = (field: keyof Inputs, value: string | number | boolean) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value as string) || value
    }));
  };

  const InputGroup: React.FC<InputGroupProps> = ({ label, children, info }) => (
    <div className="mb-4">
      <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
        {label}
        {info && (
          <div className="ml-2 group relative">
            <Info size={16} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-6 left-0 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-48 z-10">
              {info}
            </div>
          </div>
        )}
      </label>
      {children}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-900 min-h-0 text-gray-100">
      <div className="bg-gray-800 rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <CalculatorIconLucide className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-2xl font-bold text-cyan-300">Professional LED System Calculator</h1>
              <p className="text-gray-400">Complete power, thermal, optical, and cost analysis for LED installations</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-6">
          {/* Input Section */}
          <div className="xl:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Configuration</h2>
            
            <InputGroup 
              label="LED Type" 
              info="Select your LED type or choose custom for manual entry"
            >
              <select 
                value={inputs.ledType}
                onChange={(e) => handleInputChange('ledType', e.target.value)}
                className="w-full p-3 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-gray-700 text-white"
              >
                <optgroup label="Standard LEDs">
                  <option value="white_3mm">White 3mm LED (Cool)</option>
                  <option value="white_5mm">White 5mm LED (Cool)</option>
                  <option value="warm_white_3mm">Warm White 3mm LED</option>
                  <option value="warm_white_5mm">Warm White 5mm LED</option>
                  <option value="red_3mm">Red 3mm LED</option>
                  <option value="red_5mm">Red 5mm LED</option>
                  <option value="blue_3mm">Blue 3mm LED</option>
                  <option value="blue_5mm">Blue 5mm LED</option>
                  <option value="green_3mm">Green 3mm LED</option>
                  <option value="green_5mm">Green 5mm LED</option>
                  <option value="yellow_3mm">Yellow 3mm LED</option>
                  <option value="uv_5mm">UV 5mm LED</option>
                  <option value="ir_5mm">IR 5mm LED</option>
                  <option value="rgb_5mm">RGB 5mm LED</option>
                </optgroup>
                <optgroup label="High Power LEDs">
                  <option value="high_power_1w">1W High Power LED</option>
                  <option value="high_power_3w">3W High Power LED</option>
                  <option value="high_power_5w">5W High Power LED</option>
                  <option value="cob_10w">10W COB LED</option>
                  <option value="cob_20w">20W COB LED</option>
                </optgroup>
                <optgroup label="SMD LEDs">
                  <option value="smd_2835">SMD 2835</option>
                  <option value="smd_5050">SMD 5050 (RGB capable)</option>
                  <option value="smd_3528">SMD 3528</option>
                </optgroup>
                <optgroup label="Addressable LEDs">
                  <option value="addressable_ws2812b">WS2812B (NeoPixel)</option>
                </optgroup>
                <option value="custom">Custom LED</option>
              </select>
            </InputGroup>

            {inputs.ledType === 'custom' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <InputGroup label="Forward Voltage (V)">
                    <input
                      type="number"
                      step="0.1"
                      value={inputs.customForwardVoltage}
                      onChange={(e) => handleInputChange('customForwardVoltage', e.target.value)}
                      className="w-full p-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
                    />
                  </InputGroup>
                  <InputGroup label="Forward Current (mA)">
                    <input
                      type="number"
                      step="1"
                      value={inputs.customForwardCurrent}
                      onChange={(e) => handleInputChange('customForwardCurrent', e.target.value)}
                      className="w-full p-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
                    />
                  </InputGroup>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <InputGroup label="Lumens">
                    <input
                      type="number"
                      step="1"
                      value={inputs.customLumens}
                      onChange={(e) => handleInputChange('customLumens', e.target.value)}
                      className="w-full p-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
                    />
                  </InputGroup>
                  <InputGroup label="CCT (K)">
                    <input
                      type="number"
                      step="100"
                      value={inputs.customCCT}
                      onChange={(e) => handleInputChange('customCCT', e.target.value)}
                      className="w-full p-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
                    />
                  </InputGroup>
                  <InputGroup label="CRI">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={inputs.customCRI}
                      onChange={(e) => handleInputChange('customCRI', e.target.value)}
                      className="w-full p-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
                    />
                  </InputGroup>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Length (meters)">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={inputs.length}
                  onChange={(e) => handleInputChange('length', e.target.value)}
                  className="w-full p-3 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
                />
              </InputGroup>
              <InputGroup label="LEDs per Meter">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={inputs.ledsPerMeter}
                  onChange={(e) => handleInputChange('ledsPerMeter', e.target.value)}
                  className="w-full p-3 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
                />
              </InputGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Supply Voltage (V)">
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={inputs.supplyVoltage}
                  onChange={(e) => handleInputChange('supplyVoltage', e.target.value)}
                  className="w-full p-3 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
                />
              </InputGroup>
              <InputGroup label="Supply Current (A)">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={inputs.supplyAmps}
                  onChange={(e) => handleInputChange('supplyAmps', e.target.value)}
                  className="w-full p-3 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
                />
              </InputGroup>
            </div>

            <InputGroup label="Driver Type" info="Choose current regulation method">
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={inputs.includeDriver}
                      onChange={(e) => handleInputChange('includeDriver', e.target.checked)}
                      className="mr-2"
                    />
                    Use LED Driver
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={inputs.constantCurrent}
                      onChange={(e) => handleInputChange('constantCurrent', e.target.checked)}
                      className="mr-2"
                    />
                    Constant Current
                  </label>
                </div>
                {(inputs.includeDriver || inputs.constantCurrent) && (
                  <select 
                    value={inputs.driverType}
                    onChange={(e) => handleInputChange('driverType', e.target.value)}
                    className="w-full p-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
                  >
                    <option value="linear">Linear Driver (75% eff)</option>
                    <option value="switching">Switching Driver (90% eff)</option>
                    <option value="buck_boost">Buck/Boost Driver (88% eff)</option>
                  </select>
                )}
              </div>
            </InputGroup>

            <InputGroup label="Dimming Control" info="Choose dimming method">
              <select 
                value={inputs.dimmingType}
                onChange={(e) => handleInputChange('dimmingType', e.target.value)}
                className="w-full p-3 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
              >
                <option value="none">No Dimming</option>
                <option value="linear">Linear/Analog Dimming</option>
                <option value="pwm">PWM Dimming</option>
              </select>
              {inputs.dimmingType !== 'none' && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-300">Dimming Level (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={inputs.dimmingDepth}
                      onChange={(e) => handleInputChange('dimmingDepth', e.target.value)}
                      className="w-full p-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
                    />
                  </div>
                  {inputs.dimmingType === 'pwm' && (
                    <div>
                      <label className="text-xs text-gray-300">PWM Freq (Hz)</label>
                      <input
                        type="number"
                        min="100"
                        max="20000"
                        value={inputs.pwmFrequency}
                        onChange={(e) => handleInputChange('pwmFrequency', e.target.value)}
                        className="w-full p-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
                      />
                    </div>
                  )}
                </div>
              )}
            </InputGroup>

            <div className="grid grid-cols-3 gap-2">
              <InputGroup label="Wire Gauge (AWG)">
                <select 
                  value={inputs.wireGauge}
                  onChange={(e) => handleInputChange('wireGauge', e.target.value)}
                  className="w-full p-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
                >
                  <option value="12">12 AWG (20A)</option>
                  <option value="14">14 AWG (15A)</option>
                  <option value="16">16 AWG (10A)</option>
                  <option value="18">18 AWG (7A)</option>
                  <option value="20">20 AWG (5A)</option>
                  <option value="22">22 AWG (3A)</option>
                  <option value="24">24 AWG (2A)</option>
                </select>
              </InputGroup>
              <InputGroup label="Wire Length (m)">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={inputs.wireLength}
                  onChange={(e) => handleInputChange('wireLength', e.target.value)}
                  className="w-full p-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
                />
              </InputGroup>
              <InputGroup label="Ambient Temp (°C)">
                <input
                  type="number"
                  step="1"
                  value={inputs.ambientTemp}
                  onChange={(e) => handleInputChange('ambientTemp', e.target.value)}
                  className="w-full p-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
                />
              </InputGroup>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <InputGroup label="Cooling Factor">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="2.0"
                  value={inputs.coolingFactor}
                  onChange={(e) => handleInputChange('coolingFactor', e.target.value)}
                  className="w-full p-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
                />
              </InputGroup>
              <InputGroup label="Operating Hours/Day">
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="24"
                  value={inputs.operatingHours}
                  onChange={(e) => handleInputChange('operatingHours', e.target.value)}
                  className="w-full p-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
                />
              </InputGroup>
              <InputGroup label="Cost per kWh ($)">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={inputs.costPerKWh}
                  onChange={(e) => handleInputChange('costPerKWh', e.target.value)}
                  className="w-full p-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
                />
              </InputGroup>
            </div>
          </div>

          {/* Results Section */}
          <div className="xl:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Analysis Results</h2>
            
            {warnings.length > 0 && (
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-md p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-yellow-200 font-medium">Design Warnings</h3>
                    <ul className="text-yellow-300 text-sm mt-1">
                      {warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* LED Configuration */}
              <div className="bg-blue-900/20 p-4 rounded-md">
                <h3 className="font-semibold text-blue-300 mb-2 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  LED Configuration
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total LEDs: <span className="font-mono">{results.totalLEDs}</span></div>
                  <div>Power per LED: <span className="font-mono">{results.singleLEDPower?.toFixed(1)} mW</span></div>
                  <div>LEDs in Series: <span className="font-mono">{results.actualLEDsInSeries}</span></div>
                  <div>Parallel Strings: <span className="font-mono">{results.parallelStrings}</span></div>
                  <div>Temp Factor: <span className="font-mono">{results.tempDeratingFactor?.toFixed(3)}</span></div>
                  <div>Dimming Level: <span className="font-mono">{results.dimmingEfficiency?.toFixed(1)}%</span></div>
                </div>
              </div>

              {/* Power Analysis */}
              <div className="bg-green-900/20 p-4 rounded-md">
                <h3 className="font-semibold text-green-300 mb-2">Power Analysis</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>LED Power: <span className="font-mono">{results.totalLEDPower?.toFixed(2)} W</span></div>
                  <div>System Power: <span className="font-mono">{results.totalSystemPower?.toFixed(2)} W</span></div>
                  <div>Power/Meter: <span className="font-mono">{results.powerPerMeter?.toFixed(2)} W/m</span></div>
                  <div>Efficiency: <span className="font-mono">{results.efficiency?.toFixed(1)}%</span></div>
                  <div>Wire Loss: <span className="font-mono">{results.wirePowerLoss?.toFixed(2)} W</span></div>
                  <div>Driver Loss: <span className="font-mono">{results.driverPower?.toFixed(2)} W</span></div>
                </div>
              </div>

              {/* Current Limiting Components */}
              <div className="bg-purple-900/20 p-4 rounded-md">
                <h3 className="font-semibold text-purple-300 mb-2">Current Control</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {!inputs.constantCurrent && !inputs.includeDriver ? (
                    <>
                      <div>Resistor Value: <span className="font-mono">{results.resistorValue?.toFixed(1)} Ω</span></div>
                      <div>Resistor Power: <span className="font-mono">{results.resistorPower?.toFixed(3)} W</span></div>
                      <div>Min Wattage: <span className="font-mono">{results.recommendedResistorWattage} W</span></div>
                      <div>Qty Needed: <span className="font-mono">{results.parallelStrings}</span></div>
                    </>
                  ) : (
                    <>
                      <div>Driver Power: <span className="font-mono">{results.driverPower?.toFixed(2)} W</span></div>
                      <div>Driver Efficiency: <span className="font-mono">{results.driverEfficiency?.toFixed(1)}%</span></div>
                      <div>Driver Type: <span className="font-mono">{inputs.driverType}</span></div>
                      <div>Current Mode: <span className="font-mono">{inputs.constantCurrent ? 'CC' : 'CV'}</span></div>
                    </>
                  )}
                </div>
              </div>

              {/* Wire and Distribution */}
              <div className="bg-indigo-900/20 p-4 rounded-md">
                <h3 className="font-semibold text-indigo-300 mb-2">Wire & Distribution</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Wire Gauge: <span className="font-mono">{inputs.wireGauge} AWG</span></div>
                  <div>Voltage Drop: <span className="font-mono">{results.wireVoltageDrop?.toFixed(2)} V</span></div>
                  <div>Effective V: <span className="font-mono">{results.effectiveSupplyVoltage?.toFixed(2)} V</span></div>
                  <div>Wire Loss: <span className="font-mono">{results.wirePowerLoss?.toFixed(2)} W</span></div>
                  <div>Total Current: <span className="font-mono">{results.switchingCurrent?.toFixed(0)} mA</span></div>
                  <div>Fuse Rating: <span className="font-mono">{results.fuseCurrent?.toFixed(2)} A</span></div>
                </div>
              </div>

              {/* Optical Performance */}
              <div className="bg-yellow-900/20 p-4 rounded-md">
                <h3 className="font-semibold text-yellow-300 mb-2 flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  Optical Performance
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total Lumens: <span className="font-mono">{results.totalLumens?.toFixed(0)} lm</span></div>
                  <div>Lumens/Watt: <span className="font-mono">{results.lumensPerWatt?.toFixed(1)} lm/W</span></div>
                  <div>Lumens/Meter: <span className="font-mono">{results.lumensPerMeter?.toFixed(0)} lm/m</span></div>
                  <div>CCT: <span className="font-mono">{results.ledCCT} K</span></div>
                  <div>CRI: <span className="font-mono">{results.ledCRI}</span></div>
                  <div>CCT Variation: <span className="font-mono">±{results.cctVariation?.toFixed(0)} K</span></div>
                </div>
              </div>

              {/* Thermal Management */}
              <div className="bg-red-900/20 p-4 rounded-md">
                <h3 className="font-semibold text-red-300 mb-2 flex items-center">
                  <Thermometer className="w-4 h-4 mr-2" />
                  Thermal Management
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Heat Generated: <span className="font-mono">{results.totalHeatGenerated?.toFixed(2)} W</span></div>
                  <div>Temp Rise: <span className="font-mono">{results.temperatureRise?.toFixed(1)} °C</span></div>
                  <div>Heat Sink: <span className="font-mono">{results.heatSinkRequired ? 'Required' : 'Optional'}</span></div>
                  <div>Adj. Lifetime: <span className="font-mono">{((results.adjustedLifetime ?? 0) / 1000)?.toFixed(0)}k hrs</span></div>
                  <div>Cooling Factor: <span className="font-mono">{inputs.coolingFactor}x</span></div>
                  <div>Ambient: <span className="font-mono">{inputs.ambientTemp} °C</span></div>
                </div>
              </div>

              {/* Additional Components */}
              <div className="bg-orange-900/20 p-4 rounded-md">
                <h3 className="font-semibold text-orange-300 mb-2 flex items-center">
                  <Cpu className="w-4 h-4 mr-2" />
                  Additional Components
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Filter Cap: <span className="font-mono">{results.filterCapacitor?.toFixed(0)} µF</span></div>
                  <div>Decouple Caps: <span className="font-mono">{results.decouplingCapacitors} nF</span></div>
                  <div>Protection Diode: <span className="font-mono">{results.protectionDiodeCurrent?.toFixed(0)} mA</span></div>
                  <div>Switching Loss: <span className="font-mono">{results.switchingPower?.toFixed(3)} W</span></div>
                  {inputs.dimmingType === 'pwm' && (
                    <>
                      <div>PWM Frequency: <span className="font-mono">{inputs.pwmFrequency} Hz</span></div>
                      <div>Switch Type: <span className="font-mono">MOSFET</span></div>
                    </>
                  )}
                </div>
              </div>

              {/* Power Supply Requirements */}
              <div className="bg-gray-700/50 p-4 rounded-md">
                <h3 className="font-semibold text-gray-100 mb-2">Power Supply Requirements</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Min Voltage: <span className="font-mono">{results.recommendedPSVoltage} V</span></div>
                  <div>Min Current: <span className="font-mono">{results.recommendedPSCurrent?.toFixed(2)} A</span></div>
                  <div>Min Power: <span className="font-mono">{results.recommendedPSPower?.toFixed(1)} W</span></div>
                  <div>Safety Margin: <span className="font-mono">25%</span></div>
                  <div>Current/Meter: <span className="font-mono">{results.currentPerMeter?.toFixed(2)} A/m</span></div>
                  <div>Regulation: <span className="font-mono">&lt;1% recommended</span></div>
                </div>
              </div>

              {/* Cost Analysis */}
              <div className="bg-emerald-900/20 p-4 rounded-md">
                <h3 className="font-semibold text-emerald-300 mb-2">Cost Analysis</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Annual Energy: <span className="font-mono">{results.annualEnergyConsumption?.toFixed(1)} kWh</span></div>
                  <div>Annual Cost: <span className="font-mono">${results.annualOperatingCost?.toFixed(2)}</span></div>
                  <div>Daily Energy: <span className="font-mono">{((results.annualEnergyConsumption ?? 0) / 365)?.toFixed(3)} kWh</span></div>
                  <div>Daily Cost: <span className="font-mono">${((results.annualOperatingCost ?? 0) / 365)?.toFixed(3)}</span></div>
                  <div>Operating Hours: <span className="font-mono">{inputs.operatingHours} hrs/day</span></div>
                  <div>Rate: <span className="font-mono">${inputs.costPerKWh}/kWh</span></div>
                </div>
              </div>
            </div>

            {/* Summary Box */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">System Summary</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold">{results.totalLEDs}</div>
                  <div className="opacity-80">Total LEDs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{results.totalSystemPower?.toFixed(1)}W</div>
                  <div className="opacity-80">System Power</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{results.totalLumens?.toFixed(0)}</div>
                  <div className="opacity-80">Total Lumens</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{results.efficiency?.toFixed(1)}%</div>
                  <div className="opacity-80">Efficiency</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};