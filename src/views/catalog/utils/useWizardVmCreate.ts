import { useState } from 'react';
import produce from 'immer';

import useRegistryCredentials from '@catalog/utils/useRegistryCredentials/useRegistryCredentials';
import { V1Devices, V1VirtualMachine } from '@kubevirt-ui/kubevirt-api/kubevirt';
import { logTemplateFlowEvent } from '@kubevirt-utils/extensions/telemetry/telemetry';
import {
  CUSTOMIZE_VM_FAILED,
  CUSTOMIZE_VM_SUCCEEDED,
} from '@kubevirt-utils/extensions/telemetry/utils/constants';
import { addUploadDataVolumeOwnerReference } from '@kubevirt-utils/hooks/useCDIUpload/utils';
import useKubevirtUserSettings from '@kubevirt-utils/hooks/useKubevirtUserSettings/useKubevirtUserSettings';
import { createSecret } from '@kubevirt-utils/resources/secret/utils';
import { getName, getNamespace } from '@kubevirt-utils/resources/shared';
import useNamespaceUDN from '@kubevirt-utils/resources/udn/hooks/useNamespaceUDN';
import { vmBootDiskSourceIsRegistry } from '@kubevirt-utils/resources/vm/utils/source';
import {
  HEADLESS_SERVICE_LABEL,
  HEADLESS_SERVICE_NAME,
} from '@kubevirt-utils/utils/headless-service';
import { addRandomSuffix } from '@kubevirt-utils/utils/utils';
import { K8sResourceCommon, useK8sModels } from '@openshift-console/dynamic-plugin-sdk';

import { getLabels } from '../../clusteroverview/OverviewTab/inventory-card/utils/flattenTemplates';

import { createMultipleResources } from './utils';
import { useWizardVMContext } from './WizardVMContext';

type CreateVMArguments = {
  isDisableGuestSystemAccessLog: boolean;
  onFullfilled: (vm: V1VirtualMachine) => void;
};

type UseWizardVmCreateValues = {
  createVM: ({ isDisableGuestSystemAccessLog, onFullfilled }: CreateVMArguments) => Promise<void>;
  error: any;
  loaded: boolean;
};

export const useWizardVmCreate = (): UseWizardVmCreateValues => {
  const { tabsData, vm } = useWizardVMContext();
  const { decodedRegistryCredentials } = useRegistryCredentials();
  const [models] = useK8sModels();
  const [isUDNManagedNamespace] = useNamespaceUDN(getNamespace(vm));
  const [authorizedSSHKeys, updateAuthorizedSSHKeys] = useKubevirtUserSettings('ssh');

  const [loaded, setLoaded] = useState<boolean>(true);
  const [error, setError] = useState<any>();

  const createVM = async ({ isDisableGuestSystemAccessLog, onFullfilled }: CreateVMArguments) => {
    try {
      setLoaded(false);
      setError(undefined);

      const { password, username } = decodedRegistryCredentials;
      const addSecret = username && password && vmBootDiskSourceIsRegistry(vm);
      const imageSecretName = addRandomSuffix(getName(vm));
      if (addSecret) {
        await createSecret({
          namespace: getNamespace(vm),
          password,
          secretName: imageSecretName,
          username,
        });
      }

      const vmToCreate = produce(vm, (vmDraft) => {
        if (isDisableGuestSystemAccessLog) {
          const devices = (<unknown>vmDraft.spec.template.spec.domain.devices) as V1Devices & {
            logSerialConsole: boolean;
          };
          devices.logSerialConsole = false;
          vmDraft.spec.template.spec.domain.devices = devices;
        }

        if (!getLabels(vmDraft.spec.template)) vmDraft.spec.template.metadata.labels = {};

        if (!isUDNManagedNamespace)
          vmDraft.spec.template.metadata.labels[HEADLESS_SERVICE_LABEL] = HEADLESS_SERVICE_NAME;

        if (addSecret)
          vmDraft.spec.dataVolumeTemplates[0].spec.source.registry.secretRef = imageSecretName;
      });

      const createdObjects = await createMultipleResources(
        [vmToCreate, ...(tabsData?.additionalObjects as [] | K8sResourceCommon[])],
        models,
        vmToCreate.metadata.namespace,
      );

      const newVM = createdObjects[0] as V1VirtualMachine;

      // add missing ownerReferences to upload data volumes
      if (tabsData?.disks?.dataVolumesToAddOwnerRef?.length > 0) {
        await Promise.all(
          tabsData?.disks?.dataVolumesToAddOwnerRef.map((dv) =>
            addUploadDataVolumeOwnerReference(newVM, dv),
          ),
        );
      }

      if (tabsData.authorizedSSHKey && tabsData.applySSHToSettings) {
        updateAuthorizedSSHKeys({
          ...authorizedSSHKeys,
          [newVM.metadata.namespace]: tabsData.authorizedSSHKey,
        });
      }

      setLoaded(true);
      onFullfilled(newVM);

      logTemplateFlowEvent(CUSTOMIZE_VM_SUCCEEDED, null, {
        vmName: getName(vm),
      });
    } catch (e) {
      setLoaded(true);
      setError(e);
      logTemplateFlowEvent(CUSTOMIZE_VM_FAILED, null, {
        vmName: getName(vm),
      });
    }
  };

  return {
    createVM,
    error,
    loaded,
  };
};
