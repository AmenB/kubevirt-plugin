import React, { FC } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { VirtualMachineInstanceModelGroupVersionKind } from '@kubevirt-ui/kubevirt-api/console';
import { V1VirtualMachine, V1VirtualMachineInstance } from '@kubevirt-ui/kubevirt-api/kubevirt';
import DetailsPageTitle from '@kubevirt-utils/components/DetailsPageTitle/DetailsPageTitle';
import Loading from '@kubevirt-utils/components/Loading/Loading';
import PaneHeading from '@kubevirt-utils/components/PaneHeading/PaneHeading';
import SidebarEditorSwitch from '@kubevirt-utils/components/SidebarEditor/SidebarEditorSwitch';
import { useKubevirtTranslation } from '@kubevirt-utils/hooks/useKubevirtTranslation';
import useSingleNodeCluster from '@kubevirt-utils/hooks/useSingleNodeCluster';
import useVirtualMachineInstanceMigration from '@kubevirt-utils/resources/vmi/hooks/useVirtualMachineInstanceMigration';
import { isEmpty } from '@kubevirt-utils/utils/utils';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { Label, Split, SplitItem, Title } from '@patternfly/react-core';
import VirtualMachineActions from '@virtualmachines/actions/components/VirtualMachineActions/VirtualMachineActions';
import VMActionsIconBar from '@virtualmachines/actions/components/VMActionsIconBar/VMActionsIconBar';
import useVirtualMachineActionsProvider from '@virtualmachines/actions/hooks/useVirtualMachineActionsProvider';
import VirtualMachinePendingChangesAlert from '@virtualmachines/details/VirtualMachinePendingChangesAlert/VirtualMachinePendingChangesAlert';
import VMNotMigratableLabel from '@virtualmachines/list/components/VMNotMigratableLabel/VMNotMigratableLabel';

import VirtualMachineBreadcrumb from '../list/components/VirtualMachineBreadcrumb/VirtualMachineBreadcrumb';
import { getVMStatusIcon } from '../utils';

import { vmTabsWithYAML } from './utils/constants';

type VirtualMachineNavPageTitleProps = {
  instanceTypeExpandedSpec: V1VirtualMachine;
  isLoaded?: boolean;
  name: string;
  vm: V1VirtualMachine;
};

const VirtualMachineNavPageTitle: FC<VirtualMachineNavPageTitleProps> = ({
  instanceTypeExpandedSpec,
  isLoaded,
  name,
  vm,
}) => {
  const { t } = useKubevirtTranslation();
  const location = useLocation();

  const [vmi] = useK8sWatchResource<V1VirtualMachineInstance>({
    groupVersionKind: VirtualMachineInstanceModelGroupVersionKind,
    isList: false,
    name: vm?.metadata?.name,
    namespace: vm?.metadata?.namespace,
  });
  const vmim = useVirtualMachineInstanceMigration(vm);
  const [isSingleNodeCluster] = useSingleNodeCluster();
  const [actions] = useVirtualMachineActionsProvider(vm, vmim, isSingleNodeCluster);
  const StatusIcon = getVMStatusIcon(vm?.status?.printableStatus);

  const isSidebarEditorDisplayed = vmTabsWithYAML.find((tab) =>
    location.pathname.includes(`/${name}/${tab}`),
  );

  return (
    <DetailsPageTitle breadcrumb={<VirtualMachineBreadcrumb />}>
      <PaneHeading>
        <Title headingLevel="h1">
          <Split hasGutter>
            <SplitItem>
              <span className="co-m-resource-icon co-m-resource-icon--lg">{t('VM')}</span>
              <span>{name} </span>
              {!isEmpty(vm) && (
                <Label className="vm-resource-label" icon={<StatusIcon />} isCompact>
                  {vm?.status?.printableStatus}
                </Label>
              )}
              <VMNotMigratableLabel vm={vm} />
            </SplitItem>
          </Split>
        </Title>
        <Split hasGutter>
          {isSidebarEditorDisplayed && (
            <SplitItem className="VirtualMachineNavPageTitle__SidebarEditorSwitch">
              <SidebarEditorSwitch />
            </SplitItem>
          )}
          {!isLoaded && <Loading />}
          {vm && isLoaded && (
            <>
              <VMActionsIconBar vm={vm} />
              <SplitItem>
                <VirtualMachineActions actions={actions} />
              </SplitItem>
            </>
          )}
        </Split>
      </PaneHeading>
      <VirtualMachinePendingChangesAlert
        instanceTypeExpandedSpec={instanceTypeExpandedSpec}
        vm={vm}
        vmi={vmi}
      />
    </DetailsPageTitle>
  );
};

export default VirtualMachineNavPageTitle;
