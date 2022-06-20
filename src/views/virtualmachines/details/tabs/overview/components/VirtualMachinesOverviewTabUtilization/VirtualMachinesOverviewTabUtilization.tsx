import * as React from 'react';
import { Trans } from 'react-i18next';

import { V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { useKubevirtTranslation } from '@kubevirt-utils/hooks/useKubevirtTranslation';
import { useVMIAndPodsForVM } from '@kubevirt-utils/resources/vm/hooks';
import {
  Card,
  CardBody,
  CardTitle,
  DescriptionListTermHelpText,
  DescriptionListTermHelpTextButton,
  Divider,
  Grid,
  GridItem,
  Popover,
  PopoverPosition,
} from '@patternfly/react-core';

import { printableVMStatus } from '../../../../../utils';

import ComponentReady from './components/ComponentReady/ComponentReady';
import CPUUtil from './components/CPUUtil/CPUUtil';
import MemoryUtil from './components/MemoryUtil/MemoryUtil';
import NetworkUtil from './components/NetworkUtil/NetworkUtil';
import StorageUtil from './components/StorageUtil/StorageUtil';
import UtilizationThresholdCharts from './components/UtilizationThresholdCharts';

import './virtual-machines-overview-tab-utilization.scss';

type VirtualMachinesOverviewTabUtilizationProps = {
  vm: V1VirtualMachine;
};

const VirtualMachinesOverviewTabUtilization: React.FC<
  VirtualMachinesOverviewTabUtilizationProps
> = ({ vm }) => {
  const { t } = useKubevirtTranslation();
  const { vmi, pods } = useVMIAndPodsForVM(vm?.metadata?.name, vm?.metadata?.namespace);
  const isVMRunning = vm?.status?.printableStatus === printableVMStatus.Running;

  return (
    <Card className="VirtualMachinesOverviewTabUtilization--main">
      <div className="title">
        <CardTitle className="text-muted">
          <DescriptionListTermHelpText>
            <Popover
              position={PopoverPosition?.right}
              bodyContent={
                <Trans t={t} ns="plugin__kubevirt-plugin">
                  <div>Donuts chart represent current values.</div>
                  <div>Sparkline charts represent data over time</div>
                </Trans>
              }
            >
              <DescriptionListTermHelpTextButton>
                {t('Utilization')}
              </DescriptionListTermHelpTextButton>
            </Popover>
          </DescriptionListTermHelpText>
        </CardTitle>
      </div>
      <Divider />
      <CardBody isFilled>
        <ComponentReady isReady={isVMRunning} text={t('VirtualMachine is not running')}>
          <Grid>
            <GridItem span={3}>
              <CPUUtil vmi={vmi} pods={pods} />
            </GridItem>
            <GridItem span={3}>
              <MemoryUtil vmi={vmi} />
            </GridItem>
            <GridItem span={3}>
              <StorageUtil vmi={vmi} />
            </GridItem>
            <GridItem span={3}>
              <NetworkUtil vmi={vmi} />
            </GridItem>
            <UtilizationThresholdCharts vmi={vmi} pods={pods} />
          </Grid>
        </ComponentReady>
      </CardBody>
    </Card>
  );
};

export default VirtualMachinesOverviewTabUtilization;
