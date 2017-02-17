import os
import sys
import re
import argparse
from sklearn.metrics import pairwise
import load_features

'''
Example:
python clustering_confidence.py /nfs/isicvlnas01/projects/glaive/expts/00051-xpeng-CS3-faceFeatex-selfeval-proto02/expts/features/raw-features-CS3-render-45.lmdb /nfs/isicvlnas01/projects/glaive/expts/00051-xpeng-CS3-faceClustering-selfeval-proto02/expts/partition/partition_render-45.list /nfs/isicvlnas01/projects/glaive/expts/00051-xpeng-CS3-faceClustering-selfeval-proto02/expts/test7-32-cluster.csv ./output
'''

def localizeDB(feature_file):
    my_feat_lmdb = os.path.join( os.environ['TMPDIR'], os.path.basename( feature_file ) )
    return my_feat_lmdb

def distance_to_centers(feat, keys, init_cluster):
    centers = dict()
    count   = dict()

    p = re.compile('\d+\_')
    keys = [ p.sub('', x)  for x in keys ]

    with open(init_cluster, 'r') as f:
        next( f )
        for line in f:
            tmplt_id, file_name, cluster, _ = line.rstrip().split(',')

            p = re.compile('.png|.jpg|.JPG|.jpeg')
            key  = p.sub('', file_name)
            p = re.compile('/')
            key  = p.sub('-', key)

            if key in keys:
                index = keys.index(key)
                if cluster in centers:
                    centers[cluster] += feat[index]
                    count[cluster]   += 1
                else:
                    centers[cluster] = feat[index]
                    count[cluster]   = 1

    for cluster in centers:
        centers[cluster] /= count[cluster] 

    out = list()

    with open(init_cluster, 'r') as f:
        next(f)
        for line in f:
            tmplt_id, file_name, cluster, _ = line.rstrip().split(',')

            p = re.compile('.png|.jpg|.JPG|.jpeg')
            key  = p.sub('', file_name)
            p = re.compile('/')
            key  = p.sub('-', key)

            if key in keys:
                index = keys.index(key)
                sim = pairwise.cosine_similarity( centers[cluster].reshape(1,-1), feat[index].reshape(1,-1))
                out.append(tmplt_id + ',' + file_name + ',' + cluster + ',' + str(sim[0,0]) )
            else:
                out.append(tmplt_id + ',' + file_name + ',' + cluster + ',' + str(1) )

    return out 

if __name__ == "__main__":

    parser = argparse.ArgumentParser(description='Produce confidence for clutering results')
    parser.add_argument('feature_file', help='feature lmdb file')
    parser.add_argument('key_file', help='key file for features')
    parser.add_argument('init_clustering_file', help='initial clustering file')
    parser.add_argument('output_clustering_file', help='output clustering file with confidence')
    args = parser.parse_args()

    keys = load_features.load_valid_keys( args.key_file )
    feature_file = localizeDB(args.feature_file)
    feat, keys, ids = load_features.load_facial_feature( feature_file, keys )

    out = distance_to_centers( feat, keys, args.init_clustering_file )

    with open(args.output_clustering_file, 'w') as f:
        f.write('TEMPLATE_ID,FILENAME,CLUSTER_INDEX,CONFIDENCE\n')
        for line in out:
            f.write(line)
            f.write('\n')
